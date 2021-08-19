// Initializes the `vaccine-proof` service on path `/vaccine-proof`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { VaccineProof } from './vaccine-proof.class';
import hooks from './vaccine-proof.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'vaccine-proof': VaccineProof & ServiceAddons<any>;
  }
}

export default function (app: Application) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/vaccine-proof', new VaccineProof(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('vaccine-proof');

  service.hooks(hooks);
}
