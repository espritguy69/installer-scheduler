CREATE TABLE `orderHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`userId` int,
	`userName` varchar(255),
	`action` enum('created','updated','status_changed') NOT NULL,
	`fieldName` varchar(100),
	`oldValue` text,
	`newValue` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderHistory_id` PRIMARY KEY(`id`)
);
