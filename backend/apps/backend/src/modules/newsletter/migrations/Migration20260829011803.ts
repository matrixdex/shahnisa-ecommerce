import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260829011803 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "subscriber" ("id" text not null, "email" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "subscriber_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_subscriber_deleted_at" ON "subscriber" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "subscriber" cascade;`);
  }

}
