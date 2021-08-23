import { Application } from "@feathersjs/express";
import { TokenValidationResponse } from "../models/token";
import { Db } from "mongodb";

export async function updateVaccineProof(
  filter: any,
  fields: any,
  app: Application
) {
  const client: Promise<Db> = app.get("mongoClient");

  client.then(async (db) => {
    await db
      .collection("vaccine-proof")
      .findOneAndUpdate(filter, { $set: fields });
  });
}

function isIssued(issued: boolean, multiUse: boolean): boolean {
  if (multiUse) {
    return false;
  } else {
    return issued || multiUse;
  }
}
