import DS from 'ember-data';
import config from 'akx-app/config/environment';
import DataAdapterMixin from 'ember-simple-auth/mixins/data-adapter-mixin';

export default DS.RESTAdapter.extend(DataAdapterMixin, {
  host: config.APP.api_host,
  authorize( xhr ) {
    let access_token = this.get( 'session.data.authenticated.access_token' );
    xhr.setRequestHeader( 'Authorization', `Bearer ${access_token}` );
  }
});
