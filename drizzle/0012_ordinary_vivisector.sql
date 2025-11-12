CREATE TABLE `timeSlots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`time` varchar(20) NOT NULL,
	`sortOrder` int NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeSlots_id` PRIMARY KEY(`id`),
	CONSTRAINT `timeSlots_time_unique` UNIQUE(`time`)
);
