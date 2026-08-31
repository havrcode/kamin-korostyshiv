CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`public_number` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`name` text NOT NULL,
	`phone_normalized` text NOT NULL,
	`category_id` text,
	`category_snapshot` text NOT NULL,
	`message` text,
	`status` text DEFAULT 'NEW' NOT NULL,
	`consent_version` text NOT NULL,
	`source_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_public_number_unique` ON `leads` (`public_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `leads_idempotency_key_unique` ON `leads` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `leads_status_created_at_idx` ON `leads` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `leads_phone_created_at_idx` ON `leads` (`phone_normalized`,`created_at`);--> statement-breakpoint
CREATE TABLE `notification_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`channel` text DEFAULT 'TELEGRAM' NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` integer NOT NULL,
	`locked_at` integer,
	`sent_at` integer,
	`last_error_code` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notification_outbox_claim_idx` ON `notification_outbox` (`status`,`next_attempt_at`,`locked_at`);--> statement-breakpoint
CREATE INDEX `notification_outbox_lead_idx` ON `notification_outbox` (`lead_id`);