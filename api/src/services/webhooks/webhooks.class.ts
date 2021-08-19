import { GeneralError, NotImplemented } from "@feathersjs/errors";
import { Params } from "@feathersjs/feathers";
import { Db, ObjectId } from "mongodb";
import { Application } from "../../declarations";
import {
  CredExState,
  WebhookTopic,
  ServiceType,
  ServiceAction,
} from "../../models/enums";
import { updateVaccineProof } from "../../utils/vaccine-proof";
import { AriesCredentialAttribute } from "../../models/credential-exchange";

interface Data {
  state?: CredExState;
  credential_exchange_id?: string;
  credential_proposal_dict?: any;
  revocation_id?: string;
  revoc_reg_id?: string;
  connection_id?: string;
}

interface ServiceOptions { }

export class Webhooks {
  app: Application;
  options: ServiceOptions;

  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
  }

  async create(data: Data, params?: Params): Promise<any> {
    const topic = params?.route?.topic;
    switch (topic) {
      case WebhookTopic.Connections:
        this.handleConnection(data);
        return { result: "Success" };
      case WebhookTopic.IssueCredential:
        this.handleIssueCredential(data);
        return { result: "Success" };
      default:
        return new NotImplemented(`Webhook ${topic} is not supported`);
    }
  }

  private async handleConnection(data: Data): Promise<any> {
    switch (data.state) {
      case CredExState.Response:
        const client: Promise<Db> = this.app.get("mongoClient");

        return await client.then(async (db) => {
          const proof = await db
            .collection("vaccine-proof")
            .findOne({ connection_id: data.connection_id });

          if (proof) {
            const credExSvc = this.app.service('credential-exchange');
            const credExSvcRes = await credExSvc.create(proof);
            return credExSvcRes;
          } else {
            throw new GeneralError(
              "Missing vaccine proof data"
            );
          }
        });
    }
  }

  private async handleIssueCredential(data: Data): Promise<any> {
    switch (data.state) {
      case CredExState.RequestReceived:
        const attributes = data.credential_proposal_dict?.credential_proposal
          ?.attributes as AriesCredentialAttribute[];
        await this.app.service("aries-agent").create({
          service: ServiceType.CredEx,
          action: ServiceAction.Issue,
          data: {
            credential_exchange_id: data.credential_exchange_id,
            attributes: attributes,
          },
        });
        updateVaccineProof({ connection_id: data.connection_id }, data, this.app );
        return { result: "Success" };
      case CredExState.Issued:
        console.log(
          `Credential issued for cred_ex_id ${data.credential_exchange_id}`
        );
        updateVaccineProof({ credential_exchange_id: data.credential_exchange_id }, data, this.app );
        return { result: "Success" };
      default:
        console.warn(
          `Received unexpected state ${data.state} for cred_ex_id ${data.credential_exchange_id}`
        );
        return { status: `Unexpected state ${data.state}` };
    }
  }
}
