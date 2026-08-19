"use server";

import { auth } from "@/server/auth";
import { headers } from "next/headers";
import {
  createDraftRegistration,
  getRegistrationById,
  updateRegistrationStep,
  submitRegistration,
  deleteDraftRegistration,
  getAdminRegistrations,
  updateAdminRegistrationStatus,
  getAdminRegistrationById,
  patchAdminRegistrationFields,
} from "../services/donor-registration.service";

async function getSession() {
  const reqHeaders = await headers();
  return await auth.api.getSession({ headers: reqHeaders });
}

export async function createDraftRegistrationAction(donorType: string, bodyData: any) {
  try {
    const result = await createDraftRegistration(donorType, bodyData);
    return { success: true, ...result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getRegistrationAction(id: string) {
  try {
    const session = await getSession();
    const result = await getRegistrationById(id, session);
    return { success: true, ...result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateRegistrationStepAction(id: string, bodyData: any) {
  try {
    const session = await getSession();
    const result = await updateRegistrationStep(id, bodyData, session);
    return { success: true, registration: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitRegistrationAction(id: string, bodyData: any) {
  try {
    const session = await getSession();
    const result = await submitRegistration(id, bodyData, session);
    return { success: true, registration: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDraftRegistrationAction(id: string) {
  try {
    const session = await getSession();
    const result = await deleteDraftRegistration(id, session);
    return { success: true, deleted: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAdminRegistrationsAction(filters: {
  search?: string;
  donorType?: string;
  status?: string;
  bloodGroup?: string;
  hospital?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const session = await getSession();
    const result = await getAdminRegistrations(filters, session);
    return { success: true, ...result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAdminRegistrationStatusAction(bodyData: any) {
  try {
    const session = await getSession();
    const result = await updateAdminRegistrationStatus(bodyData, session);
    return { success: true, registration: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAdminRegistrationByIdAction(id: string) {
  try {
    const session = await getSession();
    const result = await getAdminRegistrationById(id, session);
    return { success: true, registration: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function patchAdminRegistrationFieldsAction(id: string, updateObj: Record<string, any>) {
  try {
    const session = await getSession();
    const result = await patchAdminRegistrationFields(id, updateObj, session);
    return { success: true, registration: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
