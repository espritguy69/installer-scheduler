ALTER TABLE `orders` MODIFY COLUMN `status` enum('pending','assigned','on_the_way','met_customer','completed','rescheduled','withdrawn') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `orders` ADD `rescheduleReason` enum('customer_issue','building_issue','network_issue');--> statement-breakpoint
ALTER TABLE `orders` ADD `rescheduledDate` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `rescheduledTime` varchar(10);