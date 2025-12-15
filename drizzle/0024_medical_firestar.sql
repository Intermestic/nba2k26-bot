CREATE TABLE `command_cooldowns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commandId` int NOT NULL,
	`userId` varchar(64),
	`channelId` varchar(64),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `command_cooldowns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_commands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trigger` varchar(100) NOT NULL,
	`response` text NOT NULL,
	`responseType` enum('text','embed','reaction') NOT NULL DEFAULT 'text',
	`embedTitle` varchar(256),
	`embedColor` varchar(7),
	`cooldownSeconds` int NOT NULL DEFAULT 0,
	`cooldownType` enum('user','channel','global') NOT NULL DEFAULT 'user',
	`permissionLevel` enum('everyone','role','admin') NOT NULL DEFAULT 'everyone',
	`requiredRoleIds` text,
	`enabled` boolean NOT NULL DEFAULT true,
	`useCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `custom_commands_id` PRIMARY KEY(`id`),
	CONSTRAINT `custom_commands_trigger_unique` UNIQUE(`trigger`)
);
--> statement-breakpoint
CREATE TABLE `goodbye_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`channelId` varchar(64) NOT NULL,
	`messageType` enum('text','embed') NOT NULL DEFAULT 'text',
	`messageContent` text NOT NULL,
	`embedTitle` varchar(256),
	`embedColor` varchar(7) DEFAULT '#ED4245',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `goodbye_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(64) NOT NULL,
	`channelId` varchar(64) NOT NULL,
	`channelName` varchar(100),
	`messageCount` int NOT NULL DEFAULT 1,
	`date` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `message_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reaction_role_panels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`channelId` varchar(64) NOT NULL,
	`messageId` varchar(64),
	`title` varchar(256) NOT NULL,
	`description` text,
	`embedColor` varchar(7) DEFAULT '#5865F2',
	`maxRoles` int NOT NULL DEFAULT 0,
	`enabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `reaction_role_panels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reaction_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`panelId` int NOT NULL,
	`emoji` varchar(100) NOT NULL,
	`roleId` varchar(64) NOT NULL,
	`roleName` varchar(100) NOT NULL,
	`description` varchar(256),
	`requiredRoleIds` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reaction_roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `server_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` enum('message_edit','message_delete','member_join','member_leave','role_add','role_remove','kick','ban','timeout','channel_create','channel_delete','channel_update','nickname_change','username_change') NOT NULL,
	`userId` varchar(64),
	`username` varchar(255),
	`channelId` varchar(64),
	`channelName` varchar(100),
	`moderatorId` varchar(64),
	`moderatorName` varchar(255),
	`oldValue` text,
	`newValue` text,
	`reason` text,
	`metadata` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `server_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_activity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(64) NOT NULL,
	`username` varchar(255) NOT NULL,
	`messageCount` int NOT NULL DEFAULT 0,
	`voiceMinutes` int NOT NULL DEFAULT 0,
	`lastActive` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_activity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voice_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(64) NOT NULL,
	`channelId` varchar(64) NOT NULL,
	`channelName` varchar(100),
	`joinedAt` timestamp NOT NULL,
	`leftAt` timestamp,
	`durationMinutes` int,
	`date` varchar(10) NOT NULL,
	CONSTRAINT `voice_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `welcome_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`channelId` varchar(64) NOT NULL,
	`messageType` enum('text','embed','card') NOT NULL DEFAULT 'embed',
	`messageContent` text NOT NULL,
	`embedTitle` varchar(256),
	`embedColor` varchar(7) DEFAULT '#5865F2',
	`embedImageUrl` text,
	`dmEnabled` boolean NOT NULL DEFAULT false,
	`dmContent` text,
	`autoRoleIds` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `welcome_config_id` PRIMARY KEY(`id`)
);
