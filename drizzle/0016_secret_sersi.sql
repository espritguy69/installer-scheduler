ALTER TABLE `orders` MODIFY COLUMN `orderNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `serviceNumber` varchar(100) NOT NULL;