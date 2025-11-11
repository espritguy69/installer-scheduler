CREATE TABLE `assignmentHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int,
	`orderId` int NOT NULL,
	`orderNumber` varchar(100),
	`installerId` int NOT NULL,
	`installerName` varchar(255),
	`scheduledDate` varchar(10),
	`scheduledStartTime` varchar(5),
	`scheduledEndTime` varchar(5),
	`action` enum('created','updated','deleted','reassigned') NOT NULL,
	`assignedBy` int,
	`assignedByName` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assignmentHistory_id` PRIMARY KEY(`id`)
);
