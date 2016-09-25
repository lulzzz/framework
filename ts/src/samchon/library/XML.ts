/// <reference path="../API.ts" />

namespace samchon.library
{
	/**
	 * @hidden
	 */
	interface XMLQuote
	{
		type: number;
		start: number;
		end: number;
	}

	/**
	 * A tree-structured XML object.
	 * 
	 * The {@link XML| class contains methods and properties for working with XML objects. The {@link XML} class (along 
	 * with the {@link XMLList}) implements the powerful XML-handling standards defined in ECMAScript for XML (E4X) 
	 * specification (ECMA-357 edition 2).
	 * 
	 * An XML object, it is composed with three members; {@link getTag tag}, {@link getProperty properties} and 
	 * {@link getValue value}. As you know, XML is a tree structured data expression method. The tree-stucture; 
	 * {@link XML} class realizes it by extending ```std.HashMap<string, XMLList>```. Child {@link XML} objects are 
	 * contained in the matched {@link XMLList} object being grouped by their {@link getTag tag name}. The 
	 * {@link XMLList} objects, they're stored in the {@link std.HashMap} ({@link XML} itself) with its **key**; common 
	 * {@link getTag tag name} of children {@link XML} objects. 
	 * 
	 * ```typescript
	 * class XML extends std.HashMap<string, XMLList>
	 * {
	 *	private tag_: string;
	 *	private properties_: std.HashMap<string, string>;
	 *	private value_: string;
	 * }
	 * ```
	 * 
	 * ```xml
	 * <?xml version="1.0" ?>
	 * <TAG property_name={property_value}>
	 *	<!-- 
	 *		The cchild XML objects with "CHILD_TAG", They're contained in an XMLList object. 
	 *		The XMLList object, it is stored in std.HashMap (XML class itself) with its key "CHILD_TAG" 
	 *	--> 
	 *	<CHILD_TAG property_name={property_value}>{value}</CHILD_TAG>
	 *  <CHILD_TAG property_name={property_value}>{value}</CHILD_TAG>
	 *	<CHILD_TAG property_name={property_value}>{value}</CHILD_TAG>
	 * 
	 *	<!-- 
	 *		The child XML object named "ANOTHER_TAG", it also belonged to an XMLList ojbect.
	 *		And the XMLList is also being contained in the std.HashMap with its key "ANOTHER_TAG"
	 *	-->
	 *	<ANOTHER_TAG />
	 * </TAG>
	 * ```
	 * 
	 * Use the {@link toString toString()} method to return a string representation of the {@link XML} object regardless 
	 * of whether the {@link XML} object has simple content or complex content.
	 * 
	 * @reference http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/XML.html
	 * @handbook https://github.com/samchon/framework/wiki/TypeScript-Library-XML
	 * @author Jeongho Nam <http://samchon.org>
	 */
	export class XML
		extends std.HashMap<string, XMLList>
	{
		/**
		 * @hidden
		 */
		private tag_: string;

		/**
		 * @hidden
		 */
		private value_: string;

		/**
		 * @hidden
		 */
		private property_map_: std.HashMap<string, string>;
	
		/* -------------------------------------------------------------
			CONSTRUCTORS
		------------------------------------------------------------- */
		/**
		 * Default Constructor.
		 */
		public constructor();

		/**
		 * Construct from string.
		 * 
		 * Creates {@link XML} object by parsing a string who represents xml structure.
		 * 
		 * @param str A string represents XML structure.
		 */
		public constructor(str: string);

		public constructor(str: string = "")
		{
			super();

			this.property_map_ = new std.HashMap<string, string>();
			this.value_ = "";

			if (str.indexOf("<") == -1)
				return;

			let start: number;
			let end: number;

			//ERASE HEADER OF XML
			if ((start = str.indexOf("<?xml")) != -1) 
			{
				end = str.indexOf("?>", start);

				if (end != -1)
					str = str.substr(end + 2);
			}

			//ERASE COMMENTS
			while ((start = str.indexOf("<!--")) != -1) 
			{
				end = str.indexOf("-->", start);
				if (end != -1)
					break;

				str = str.substr(0, start) + str.substr(end + 3);
			}
		
			//BEGIN PARSING
			this.parse(str);
		}

		/**
		 * @hidden
		 */
		private parse(str: string): void
		{
			this.parse_tag(str);
			this.parse_properties(str);

			let res = this.parse_value(str);
			if (res.second == true)
				this.parse_children(res.first);
		}

		/**
		 * @hidden
		 */
		private parse_tag(str: string): void
		{
			let start: number = str.indexOf("<") + 1;
			let end: number =
				this.compute_min_index
					(
						str.indexOf(" ", start),
						str.indexOf("\r\n", start),
						str.indexOf("\n", start),
						str.indexOf("\t", start),
						str.indexOf(">", start),
						str.indexOf("/", start)
					);
			if (start == 0 || end == -1) 
				return;
		
			this.tag_ = str.substring(start, end);
		}

		/**
		 * @hidden
		 */
		private parse_properties(str: string): void
		{
			let start: number = str.indexOf("<" + this.tag_) + this.tag_.length + 1;
			let end: number = this.compute_min_index(str.lastIndexOf("/"), str.indexOf(">", start));

			if (start == -1 || end == -1 || start >= end)
				return;
		
			//<comp label='ABCD' /> : " label='ABCD' "
			let line: string = str.substring(start, end);
			if (line.indexOf("=") == -1) 
				return;
		
			let label: string;
			let value: string;
			let helpers: XMLQuote[] = [];

			let inQuote: boolean = false;
			let quoteType: number;
			let equal: number;

			//INDEXING
			for (let i: number = 0; i < line.length; i++) 
			{
				//Start of quote
				if (inQuote == false && (line.charAt(i) == "'" || line.charAt(i) == "\"")) 
				{
					inQuote = true;
					start = i;

					if (line.charAt(i) == "'")
						quoteType = 1;
					else if (line.charAt(i) == "\"")
						quoteType = 2;
				}
				else if
					(
						inQuote == true &&
						(
							(quoteType == 1 && line.charAt(i) == "'") ||
							(quoteType == 2 && line.charAt(i) == "\"")
						)
					) 
				{
					helpers.push({ type: quoteType, start: start, end: i });
					inQuote = false;
				}
			}

			//CONSTRUCTING
			for (let i: number = 0; i < helpers.length; i++) 
			{
				let quote = helpers[i];

				if (i == 0) 
				{
					equal = line.indexOf("=");
					label = line.substring(0, equal).trim();
				}
				else 
				{
					equal = line.indexOf("=", helpers[i - 1].end + 1);
					label = line.substring(helpers[i - 1].end + 1, equal).trim();
				}
				value = line.substring(helpers[i].start + 1, helpers[i].end);
			
				this.setProperty(label, this.decode_property(value));
			}
		}

		/**
		 * @hidden
		 */
		private parse_value(str: string): std.Pair<string, boolean>
		{
			let end_slash: number = str.lastIndexOf("/");
			let end_block: number = str.indexOf(">");

			if (end_slash < end_block || end_slash + 1 == str.lastIndexOf("<")) 
			{
				//STATEMENT1: <TAG />
				//STATEMENT2: <TAG></TAG> -> SAME WITH STATEMENT1: <TAG />
				this.value_ = "";
			
				return new std.Pair<string, boolean>(str, false);
			}

			let start: number = end_block + 1;
			let end: number = str.lastIndexOf("<");
			str = str.substring(start, end); //REDEFINE WEAK_STRING -> IN TO THE TAG

			if (str.indexOf("<") == -1)
				this.value_ = this.decode_value(str.trim());
			else
				this.value_ = "";

			return new std.Pair<string, boolean>(str, true);
		}

		/**
		 * @hidden
		 */
		private parse_children(str: string): void
		{
			if (str.indexOf("<") == -1)
				return;
		
			let start: number = str.indexOf("<");
			let end: number = str.lastIndexOf(">") + 1;
			str = str.substring(start, end);

			let blockStart: number = 0;
			let blockEnd: number = 0;
			start = 0;

			for (let i: number = 0; i < str.length; i++) 
			{
				if (str.charAt(i) == "<" && str.substr(i, 2) != "</")
					blockStart++;
				else if (str.substr(i, 2) == "/>" || str.substr(i, 2) == "</")
					blockEnd++;

				if (blockStart >= 1 && blockStart == blockEnd) 
				{
					end = str.indexOf(">", i);

					let xmlList: XMLList;
					let xml: XML = new XML();
					xml.parse( str.substring(start, end + 1) );

					if (this.has(xml.tag_) == true)
						xmlList = this.get(xml.tag_);
					else 
					{
						xmlList = new XMLList();
						this.set(xml.tag_, xmlList);
					}
					xmlList.push(xml);
				
					i = end;
					start = end + 1;
					blockStart = 0;
					blockEnd = 0;
				}
			}
		}

		/* -------------------------------------------------------------
			ACCESSORS
		------------------------------------------------------------- */
		/**
		 * Get tag.
		 */
		public getTag(): string
		{
			return this.tag_;
		}
		/** 
		 * Get value.
		 */
		public getValue(): string
		{
			return this.value_;
		}

		/**
		 * Test whether a property exists or not.
		 */
		public hasProperty(key: string): boolean
		{
			return this.property_map_.has(key);
		}

		/**
		 * Get property by its key.
		 */
		public getProperty(key: string): string
		{
			return this.property_map_.get(key);
		}

		/**
		 * Get property map.
		 */
		public getPropertyMap(): std.HashMap<string, string>
		{
			return this.property_map_;
		}

		/* -------------------------------------------------------------
			SETTERS
		------------------------------------------------------------- */
		/**
		 * Set tag (identifier) of the XML.
		 */
		public setTag(str: string): void
		{
			this.tag_ = str;
		}

		/**
		 * Set value.
		 *
		 * @param val A value to set
		 */
		public setValue(str: string): void
		{
			this.value_ = str;
		}

		/**
		 * Set a property with its key.
		 */
		public setProperty(key: string, value: string): void
		{
			this.property_map_.set(key, value);
		}

		/**
		 * Erase a property by its key.
		 *
		 * @param key The key of the property to erase
		 * @throw exception out of range
		 */
		public eraseProperty(key: string): void
		{
			if(this.property_map_.has(key) == false)
				throw Error("out of range");
			else
				this.property_map_.erase(key);
		}

		/**
		 * @hidden
		 */
		public push(...args: std.Pair<string, XMLList>[]): number;
		
		/**
		 * @hidden
		 */
		public push(...args: [string, XMLList][]): number;
		

		public push(...xmls: XML[]): number;
		

		public push(...xmlLists: XMLList[]): number;

		public push(...items: any[]): number
		{
			for (let i: number = 0; i < items.length; i++)
			{
				if (items[i] instanceof XML)
				{
					let xml: XML = items[i];

					if (this.has(xml.tag_) == true)
						this.get(xml.tag_).push(xml);
					else 
					{
						let xmlList: XMLList = new XMLList();
						xmlList.push(xml);

						this.set(xml.tag_, xmlList);
					}
				}
				else if (items[i] instanceof XMLList)
				{
					let xmlList: XMLList = items[i];
					
					if (xmlList.empty() == true)
						continue;

					if (this.has(xmlList.getTag()) == true)
					{
						let myXMLList: XMLList = this.get(xmlList.getTag());

						myXMLList.insert(myXMLList.end(), xmlList.begin(), xmlList.end());
					}
					else
						this.set(xmlList.getTag(), xmlList);
				}
				else
					super.push(items[i]);
			}

			return this.size();
		}

		public addAllProperties(xml: XML): void
		{
			for (let it = xml.property_map_.begin(); it.equal_to(xml.property_map_.end()) == false; it = it.next())
				this.setProperty(it.first, it.second);
		}

		public clearProperties(): void
		{
			this.property_map_.clear();
		}

		/* -------------------------------------------------------------
			FILTERS
		------------------------------------------------------------- */
		/**
		 * @hidden
		 */
		private compute_min_index(...args: number[]): number 
		{
			let min: number = args[0];

			for (let i: number = 1; i < args.length; i++)
			{
				if (args[i] == -1)
					continue;

				if (min == -1 || args[i] < min)
					min = args[i];
			}
			return min;
		}

		/**
		 * @hidden
		 */
		private decode_value(str: string): string 
		{
			let pairs: Array<std.Pair<string, string>> =
				[
					new std.Pair("&amp;", "&"),
					new std.Pair("&lt;", "<"),
					new std.Pair("&gt;", ">")
				];

			return StringUtil.replaceAll(str, ...pairs);
		}

		/**
		 * @hidden
		 */
		private encode_value(str: string): string 
		{
			let pairs: Array<std.Pair<string, string>> =
				[
					new std.Pair("&", "&amp;"),
					new std.Pair("<", "&lt;"),
					new std.Pair(">", "&gt;")
				];
			return StringUtil.replaceAll(str, ...pairs);
		}

		/**
		 * @hidden
		 */
		private decode_property(str: string): string 
		{
			let pairs: Array<std.Pair<string, string>> =
				[
					new std.Pair("&amp;", "&"),
					new std.Pair("&lt;", "<"),
					new std.Pair("&gt;", ">"),
					new std.Pair("&quot;", "\""),
					new std.Pair("&apos;", "'"),
					new std.Pair("&#x9;", "\t"),
					new std.Pair("&#xA;", "\n"),
					new std.Pair("&#xD;", "\r"),
				];
			return StringUtil.replaceAll(str, ...pairs);
		}

		/**
		 * @hidden
		 */
		private encode_property(str: string): string 
		{
			let pairs: Array<std.Pair<string, string>> =
				[
					new std.Pair("&", "&amp;"),
					new std.Pair("<", "&lt;"),
					new std.Pair(">", "&gt;"),
					new std.Pair("\"", "&quot;"),
					new std.Pair("'", "&apos;"),
					new std.Pair("\t", "&#x9;"),
					new std.Pair("\n", "&#xA;"),
					new std.Pair("\r", "&#xD;"),
				];
			return StringUtil.replaceAll(str, ...pairs);
		}

		/* -------------------------------------------------------------
			EXPORTS
		------------------------------------------------------------- */
		/**
		 * {@link XML} object to xml string.
		 * 
		 * Returns a string representation of the {@link XML} object.
		 * 
		 * @param tab Number of tabs to spacing.
		 * @return The string representation of the {@link XML} object.
		 */
		public toString(tab: number = 0): string
		{
			let str: string = StringUtil.repeat("\t", tab) + "<" + this.tag_;
			let children_str: string = "";

			//PROPERTIES
			for (let p_it = this.property_map_.begin(); p_it.equal_to(this.property_map_.end()) == false; p_it = p_it.next())
				str += " " + p_it.first + "=\"" + this.encode_property(p_it.second) + "\"";
		
			if (this.size() == 0) 
			{
				// VALUE
				if (this.value_ != "")
					str += ">" + this.encode_value(this.value_) + "</" + this.tag_ + ">";
				else
					str += " />";
			} 
			else 
			{
				// CHILDREN
				str += ">\n";

				for (let x_it = this.begin(); x_it.equal_to(this.end()) == false; x_it = x_it.next())
					str += x_it.second.toString(tab + 1);
			
				str += StringUtil.repeat("\t", tab) + "</" + this.tag_ + ">";
			}
			return str;
		}
	}
	
	/**
	 * List of {@link XML} objects with same tag.
	 * 
	 * @reference http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/XMLList.html
	 * @handbook https://github.com/samchon/framework/wiki/TypeScript-Library-XML
	 * @author Jeongho Nam <http://samchon.org>
	 */
	export class XMLList
		extends std.Deque<XML>
	{
		// using super::constructor

		/**
		 * Get tag.
		 */
		public getTag(): string
		{
			return this.front().getTag();
		}

		/**
		 * {@link XMLList XML objects} to string.
		 * 
		 * Returns a string representation of the {@link XMLList XML objects}.
		 * 
		 * @param tab Number of tabs to spacing.
		 * @return The string representation of the {@link XMLList XML objects}.
		 */
		public toString(level: number = 0): string 
		{
			let str: string = "";
			
			for (let i: number = 0; i < this.size(); i++)
				str += this.at(i).toString(level) + "\n";

			return str;
		}
	}
}