import { Client, Account, Databases, Storage, Functions, Query, ID } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '6ad3186d001bc03e990e';

export const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'partner-db';
export const STORAGE_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET || 'partner_storage';
export const EMAIL_FUNCTION_ID = import.meta.env.VITE_APPWRITE_FUNCTION_EMAIL || 'send-email';

export const COLLECTIONS = {
  ai_onboardings: 'ai_onboardings',
  consultations: 'consultations',
  appointments: 'appointments',
  clients: 'partner_clients',
  packages: 'subscription_packages',
  projects: 'partner_projects',
  milestones: 'project_milestones',
  change_requests: 'website_change_requests',
  care_plan_logs: 'care_plan_logs',
  tickets: 'partner_support_tickets',
  ticket_messages: 'partner_ticket_messages',
  invoices: 'partner_invoices',
  project_files: 'project_files',
} as const;

export { Query, ID };
