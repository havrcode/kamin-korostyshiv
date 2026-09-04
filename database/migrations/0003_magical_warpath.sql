CREATE TABLE `product_images` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`original_key` text NOT NULL,
	`webp_key` text NOT NULL,
	`public_url` text NOT NULL,
	`alt` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`original_mime` text NOT NULL,
	`original_bytes` integer NOT NULL,
	`checksum_sha256` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_images_webp_key_unique` ON `product_images` (`webp_key`);--> statement-breakpoint
CREATE INDEX `product_images_product_order_idx` ON `product_images` (`product_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `product_images_product_published_idx` ON `product_images` (`product_id`,`published`,`deleted_at`);--> statement-breakpoint
CREATE TRIGGER `product_images_max_five_active`
BEFORE INSERT ON `product_images`
WHEN NEW.deleted_at IS NULL
  AND (SELECT COUNT(*) FROM `product_images`
       WHERE product_id = NEW.product_id AND deleted_at IS NULL) >= 5
BEGIN
  SELECT RAISE(ABORT, 'PRODUCT_IMAGE_LIMIT_REACHED');
END;
