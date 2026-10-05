import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261005214429 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "material" drop constraint if exists "material_slug_unique";`);
    this.addSql(`alter table if exists "config_site" drop constraint if exists "config_site_chave_unique";`);
    this.addSql(`create table if not exists "config_site" ("id" text not null, "chave" text not null, "valor" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "config_site_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_config_site_chave_unique" ON "config_site" ("chave") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_config_site_deleted_at" ON "config_site" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "material" ("id" text not null, "nome" text not null, "slug" text not null, "descricao" text null, "ingredientes" text null, "origem" text null, "imagem_url" text null, "ordem" integer not null default 0, "ativo" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "material_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_material_slug_unique" ON "material" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_material_deleted_at" ON "material" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "config_site" cascade;`);

    this.addSql(`drop table if exists "material" cascade;`);
  }

}
