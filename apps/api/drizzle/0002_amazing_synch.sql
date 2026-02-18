CREATE INDEX "comment_author_id_idx" ON "comment" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "notification_actor_id_idx" ON "notification" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "project_file_uploader_id_idx" ON "project_file" USING btree ("uploader_id");