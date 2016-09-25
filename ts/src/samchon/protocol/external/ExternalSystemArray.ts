﻿/// <reference path="../../API.ts" />

/// <reference path="../EntityCollection.ts" />

/**
 * [[include: https://raw.githubusercontent.com/samchon/framework/master/handbook/TypeScript-Protocol-External_System.md]]
 */
namespace samchon.protocol.external
{
	/**
	 * An array and manager of {@link ExternalSystem external systems}.
	 * 
	 * {@link ExternalSystemArray} is an abstract class contains and manages external system drivers, 
	 * {@link ExternalSystem} objects. You can specify this {@link ExternalSystemArray} to be a server accepting 
	 * {@link ExternalSystem external clients} or a client connecting to {@link IExternalServer external servers}. Even 
	 * both of them is also possible.
	 * 
	 * <ul>
	 *	<li> A server accepting external clients: {@link IExternalClientArray} </li>
	 *	<li> A client connecting to external servers: {@link IExternalServerArray} </li>
	 *	<li> 
	 *		Accepts external clients & Connects to external servers at the same time: 
	 *		{@link IExternalServerClientArray}
	 *	</li>
	 * </ul>
	 * 
	 * <a href="http://samchon.github.io/framework/images/design/ts_class_diagram/protocol_external_system.png" 
	 *		  target="_blank">
	 *	<img src="http://samchon.github.io/framework/images/design/ts_class_diagram/protocol_external_system.png" 
	 *		 style="max-width: 100%" />
	 * </a>
	 * 
	 * <h4> Proxy Pattern </h4>
	 * The {@link ExternalSystemArray} class can use *Proxy Pattern*. In framework within user, which
	 * {@link ExternalSystem external system} is connected with {@link ExternalSystemArray this system}, it's not
	 * important. Only interested in user's perspective is *which can be done*.
	 * 
	 * By using the *logical proxy*, user dont't need to know which {@link ExternalSystemRole role} is belonged
	 * to which {@link ExternalSystem system}. Just access to a role directly from {@link ExternalSystemArray.getRole}.
	 * Sends and receives {@link Invoke} message via the {@link ExternalSystemRole role}.
	 * 
	 * <ul>
	 *	<li>
	 *		{@link ExternalSystemRole} can be accessed from {@link ExternalSystemArray} directly, without inteferring
	 *		from {@link ExternalSystem}, with {@link ExternalSystemArray.getRole}.
	 *	</li>
	 *	<li>
	 *		When you want to send an {@link Invoke} message to the belonged {@link ExternalSystem system}, just call
	 *		{@link ExternalSystemRole.sendData ExternalSystemRole.sendData()}. Then, the message will be sent to the
	 *		external system.
	 *	</li>
	 *	<li> Those strategy is called *Proxy Pattern*. </li>
	 * </ul>
	 * 
	 * @author Jeongho Nam <http://samchon.org>
	 */
	export abstract class ExternalSystemArray
		extends EntityDequeCollection<ExternalSystem>
		implements IProtocol
	{
		/* ---------------------------------------------------------
			CONSTRUCTORS
		--------------------------------------------------------- */
		/**
		 * Default Constructor.
		 */
		public constructor()
		{
			super();
			
			this.addEventListener("erase", this.handle_system_erase, this);
		}

		/**
		 * @hidden
		 */
		private handle_system_erase(event: collection.CollectionEvent<ExternalSystem>): void
		{
			for (let it = event.first; !it.equal_to(event.last); it = it.next())
				it.value.destructor();
		}

		/* ---------------------------------------------------------
			ACCESSORS
		--------------------------------------------------------- */
		/**
		 * Test whether this system array has the role.
		 * 
		 * @param name Name, identifier of target {@link ExternalSystemRole role}.
		 * 
		 * @return Whether the role has or not.
		 */
		public hasRole(name: string): boolean
		{
			for (let i: number = 0; i < this.size(); i++)
				for (let j: number = 0; j < this.at(i).size(); j++)
					if (this.at(i).at(j).key() == name)
						return true;

			return false;
		}

		/**
		 * Get a role.
		 * 
		 * @param name Name, identifier of target {@link ExternalSystemRole role}.
		 * 
		 * @return The specified role.
		 */
		public getRole(name: string): ExternalSystemRole
		{
			for (let i: number = 0; i < this.size(); i++)
				for (let j: number = 0; j < this.at(i).size(); j++)
					if (this.at(i).at(j).key() == name)
						return this.at(i).at(j);

			throw new std.OutOfRange("No role with such name.");
		}

		/* ---------------------------------------------------------
			MESSAGE CHAIN
		--------------------------------------------------------- */
		/**
		 * Send an {@link Invoke} message.
		 * 
		 * @param invoke An {@link Invoke} message to send.
		 */
		public sendData(invoke: Invoke): void
		{
			for (let i: number = 0; i < this.size(); i++)
				this.at(i).sendData(invoke);
		}

		/**
		 * Handle an {@Invoke} message have received.
		 * 
		 * @param invoke An {@link Invoke} message have received.
		 */
		public replyData(invoke: Invoke): void
		{
			invoke.apply(this);
		}

		/* ---------------------------------------------------------
			EXPORTERS
		--------------------------------------------------------- */
		/**
		 * Tag name of the {@link ExternalSytemArray} in {@link XML}.
		 *
		 * @return *systemArray*.
		 */
		public TAG(): string
		{
			return "systemArray";
		}

		/**
		 * Tag name of {@link ExternalSystem children elements} belonged to the {@link ExternalSytemArray} in {@link XML}.
		 * 
		 * @return *system*.
		 */
		public CHILD_TAG(): string
		{
			return "system";
		}
	}
}