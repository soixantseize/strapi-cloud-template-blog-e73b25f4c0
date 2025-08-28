'use strict';

const { pages, leadFormSubmissions } = require('../data/data.json');

async function createEntry({ model, entry }) {
  try {
    // Check if entry already exists by slug
    if (entry.slug !== undefined) {
      const existing = await strapi.documents(`api::${model}.${model}`).findFirst({
        filters: { slug: entry.slug }
      });
      if (existing) {
        console.log(`${model} with slug "${entry.slug}" already exists, skipping...`);
        return existing;
      }
    }
    
    // Actually create the entry in Strapi
    const created = await strapi.documents(`api::${model}.${model}`).create({
      data: {
        ...entry,
        publishedAt: Date.now()
      }
    });
    console.log(`Created ${model}: ${entry.shortName || entry.slug || entry.email}`);
    return created;
  } catch (error) {
    console.error({ model, entry, error });
  }
}

async function importPages() {
  console.log('Importing pages...');
  console.log(`Found ${pages.length} pages to import`);
  for (const page of pages) {
    console.log(`Importing page: ${page.shortName} with slug: "${page.slug}"`);
    await createEntry({
      model: 'page',
      entry: page,
    });
  }
}

async function importLeadFormSubmissions() {
  console.log('Importing lead form submissions...');
  for (const submission of leadFormSubmissions) {
    await createEntry({
      model: 'lead-form-submission',
      entry: submission,
    });
  }
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = 'error';

  try {
    console.log('Importing corporate data...');
    await importPages();
    await importLeadFormSubmissions();
    console.log('Corporate data import completed');
  } catch (error) {
    console.log('Could not import corporate data');
    console.error(error);
  }

  await app.destroy();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});