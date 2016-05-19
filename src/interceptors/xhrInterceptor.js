import {isFunction} from '../helpers/util';
import { baseInterceptor, getQuery } from './baseInterceptor';
import { nativeXHR } from '../helpers/nativeServices';

export const name = 'XMLHttpRequest';
export const Reference = nativeXHR;

export const fakeService = config =>
  baseInterceptor(config, class fakeXMLHttpRequest {
    constructor(helpers) {
      this.xhr = new Reference();
      this.getHandler = helpers.getHandler;
      this.getParams = helpers.getParams;
      this._requestHeaders = {};

      setXhrState(this, this.xhr);
    }

    //TODO: Handle 'async', 'user', 'password'
    open(method, url, async, user, password) {
      this.method = method;
      this.url = url;
      this.xhr.open(method, url);
    }

    //TODO: Handle 'data' parameter
    //TODO: Support all handlers 'progress', 'loadstart', 'abort', 'error'
    send(data) {
      const handler = this.getHandler(this.url, this.method);
      const xhr = this.xhr;
      const onreadyCallback = this.onreadystatechange;
      const onloadCallback = this.onload;
      const successCallback = onreadyCallback || onloadCallback;

      if (handler && successCallback) {
        const params = this.getParams(this.url, this.method);
        const query = getQuery(this.url);
        const headers = this._requestHeaders;

        this.readyState = 4;
        this.status = 200; // @TODO (zzarcon): Support custom status codes
        //TODO: Pass 'body' to handler
        this.responseText = this.response = handler({params, query, headers});

        return successCallback();
      }

      //TODO: Automatically set all the properties
      xhr.onreadystatechange = () => {
        this.readyState = xhr.readyState;
        this.response = xhr.response;
        this.responseText = xhr.responseText;
        this.responseType = xhr.responseType;
        this.responseXML = xhr.responseXML;
        this.status = xhr.status;
        this.statusText = xhr.statusText;
        
        onreadyCallback && onreadyCallback.call(xhr);
      };

      xhr.onload = () => {
        onloadCallback && onloadCallback.call(xhr);
      };

      return xhr.send();
    }

    setRequestHeader(name, value) {
      this._requestHeaders[name] = value;

      this.xhr.setRequestHeader(name, value);
    }
  });

const setXhrState = (fakeInstance, xhr) => {
  for (let prop in xhr) {
    const value = xhr[prop];
    if (!fakeInstance[prop]) {
      fakeInstance[prop] = isFunction(value) ? value.bind(xhr) : value;
    }
  }
};