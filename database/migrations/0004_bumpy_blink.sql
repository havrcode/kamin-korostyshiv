CREATE TABLE `lead_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`storage_key` text NOT NULL,
	`original_name` text NOT NULL,
	`mime` text NOT NULL,
	`bytes` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lead_attachments_storage_key_unique` ON `lead_attachments` (`storage_key`);--> statement-breakpoint
CREATE INDEX `lead_attachments_lead_created_idx` ON `lead_attachments` (`lead_id`,`created_at`);