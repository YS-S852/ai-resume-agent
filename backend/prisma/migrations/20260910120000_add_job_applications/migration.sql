CREATE TABLE IF NOT EXISTS `job_applications` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER NOT NULL,
  `job_description_id` INTEGER NULL,
  `resume_id` INTEGER NULL,
  `legacy_document_id` INTEGER NULL,
  `company` VARCHAR(100) NOT NULL,
  `position` VARCHAR(100) NOT NULL,
  `salary` VARCHAR(50) NULL,
  `location` VARCHAR(100) NULL,
  `source` VARCHAR(50) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'wishlist',
  `notes` TEXT NULL,
  `job_url` VARCHAR(1000) NULL,
  `applied_date` DATETIME(3) NULL,
  `interview_date` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `job_applications_legacy_document_id_key` (`legacy_document_id`),
  INDEX `job_applications_user_id_status_idx` (`user_id`, `status`),
  INDEX `job_applications_user_id_updated_at_idx` (`user_id`, `updated_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `job_applications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `job_applications_job_description_id_fkey` FOREIGN KEY (`job_description_id`) REFERENCES `job_descriptions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `job_applications_resume_id_fkey` FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `job_applications` (
  `user_id`, `legacy_document_id`, `company`, `position`, `salary`, `location`,
  `source`, `status`, `notes`, `created_at`, `updated_at`
)
SELECT
  `user_id`,
  `id`,
  LEFT(COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`content`, '$.company')), 'null'), '未知公司'), 100),
  LEFT(COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`content`, '$.position')), 'null'), '未知职位'), 100),
  LEFT(NULLIF(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`content`, '$.salary')), 'null'), ''), 50),
  LEFT(NULLIF(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`content`, '$.location')), 'null'), ''), 100),
  LEFT(NULLIF(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`content`, '$.source')), 'null'), ''), 50),
  CASE
    WHEN JSON_UNQUOTE(JSON_EXTRACT(`content`, '$.status')) IN ('wishlist', 'applied', 'interview', 'offer', 'rejected')
      THEN JSON_UNQUOTE(JSON_EXTRACT(`content`, '$.status'))
    ELSE 'wishlist'
  END,
  NULLIF(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`content`, '$.notes')), 'null'), ''),
  `created_at`,
  `updated_at`
FROM `career_documents`
WHERE `type` = 'job_application' AND JSON_VALID(`content`);
