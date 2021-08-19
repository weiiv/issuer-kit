
import { Db } from "mongodb";
import { Service, MongoDBServiceOptions } from "feathers-mongodb";
import { Id, Params } from "@feathersjs/feathers";
import {
  ServiceSwaggerAddon,
  ServiceSwaggerOptions,
} from "feathers-swagger/types";
import { Application } from "../../declarations";
import { Claim } from "../../models/credential";
import { AriesInvitation } from "../../models/connection";
import {
  AriesCredentialAttribute,
  AriesCredentialOffer,
  CredExServiceResponse,
} from "../../models/credential-exchange";
import { ServiceAction, ServiceType } from "../../models/enums";
import { formatCredentialOffer } from "../../utils/credential-exchange";
import { AriesSchema } from "../../models/schema";
import logger from "../../logger";

interface Data {
  token?: string;
  schema_id: string;
  connection_id: string;
  claims: Claim[];
}

interface ServiceOptions { }

export class VaccineProof extends Service implements ServiceSwaggerAddon {
  app: Application;

  constructor(options: Partial<MongoDBServiceOptions>, app: Application) {
    super(options);
    this.app = app;

    const client: Promise<Db> = app.get("mongoClient");
    client.then((db) => {
      this.Model = db.collection("vaccine-proof");
    });
  }

  async create(data: Data, params?: Params): Promise<any> {
    const connSvc = this.app.service('connection');
    const connSvcRes: AriesInvitation = await connSvc.create({});
    if (connSvcRes.invitation_url) {
      data.connection_id = connSvcRes.connection_id;
      super.create(data);
      return { 'invitation_url': connSvcRes.invitation_url }
    } else {
      return { status: `Failed issuing vaccine proof` };
    }
  }

  docs: ServiceSwaggerOptions = {
    description: "Vaccine Proof",
    idType: "string",
  };

  model = {
    title: "Vaccine Proof",
    description: "Vaccine Proof Model",
    type: "object",
    required: [],
    properties: {
      token: {
        type: "string",
        description:
          "The token for authentication",
        readonly: true,
      },
      schema_id: {
        type: "string",
        description:
          "The id of the schema",
      },
      connection_id: {
        type: "string",
        description:
          "The id for the connection",
      },
      claims: {
        type: "array",
        items: {
          type: "string",
        },
        description:
          "Vaccine Proof Claims",
      },
    },
  };
}
