Sails-Generate-Ember-Blueprints
======================

[![NPM version](https://badge.fury.io/js/sails-generate-ember-blueprints.svg)](http://badge.fury.io/js/sails-generate-ember-blueprints) ![Build status](https://travis-ci.org/mphasize/sails-generate-ember-blueprints.svg?branch=master)

Ember Data compatible blueprints for Sails v0.10+

[Sails](http://www.sailsjs.org/) supports overriding the default blueprints, which gives us a remarkable flexibility in making Sails work together with a variety of clients and frontend libraries.

The blueprints in this repository are meant as a starting point to modify the Sails API JSON output to make it work with Ember, Ember Data and the default Ember Data RESTAdapter.

If you're looking for something that makes Ember work with the standard Sails API, take a look at [ember-data-sails-adapter](https://github.com/bmac/ember-data-sails-adapter) and the alternatives discussed there.

# API flavors

The generators support different flavors for your API.

**basic**: Basic blueprints should get you up and running in no time and serve as a good basis to start development. They come with a default configuration that sideloads all records found in the model's associations.

**advanced**: If you need more powerful control over your API, you may consider upgrading to the "advanced" blueprints. These blueprints allow fine-grained control over how API responses handle sideloading a model's associations.

**embedded**: Unfortunately not yet available, but at some point in time we hope to support an embedded records flavor that can be consumed by Embers EmbeddedRecorsMixin. **Contributers please get in touch.** 

**json-api**: Unfortunately not yet available, but it would also be great to support 100% [json api](http://jsonapi.org/) compatible responses.

# Getting started


* Install the generator into your (new) Sails project `npm install sails-generate-ember-blueprints`
* Run the generator: `sails generate ember-blueprints` 
* Configure sails to use **pluralized** blueprint routes.

	In `myproject/config/blueprints.js` set `pluralize: true`


      module.exports.blueprints = {
        // ...
        pluralize: true
      };


* Generate some API resources, e.g. `sails generate api user`
* Start your app with `sails lift`

Now you should be up and running and your Ember Data app should be able to talk to your Sails backend.

### Advanced Blueprints

The "basic" blueprints make a basic Sails app work with Ember Data, but in a more complex project you may need more fine-grained control over how the Sails Rest API handles associations/relations and what is included in the API responses. Enter the "advanced" blueprints.

* Run the generator with: `sails generate ember-blueprints advanced --force` to update to the advanced blueprints.
* Add a configuration option `associations: { list: "link", detail: "record" }`
 to `myproject/config/models.js`. This will determine the default behaviour.

      module.exports.models = {
        // ...
        associations: {
        	list: "link",
        	detail: "record"
        }
      };
 
* Add a configuration option `validations: { ignoreProperties: [ 'includeIn' ] }`
to `myproject/config/models.js`. This tells Sails to ignore our individual configuration on a model's attributes.

      module.exports.models = {
        // ...
        validations: {
        	ignoreProperties: ['includeIn']
        }
      };

* Setup individual presentation on a model attribute by adding `includeIn: { list: "option", detail: "option"}` where option is one of `link`, `index`, `record`.

      attributes: {
        name : "string",
        posts: {
          collection: "post",
          via: "user",
          includeIn: {
            list: "record",
            detail: "record"
          }
        }
      }


**Presentation options:**  
The `link` setting will generate jsonapi.org URL style `links` properties on the records, which Ember Data can consume and load lazily.

The `index` setting will generate an array of ID references for Ember Data, so be loaded as necessary.

The `record` setting will sideload the complete record.


### Troubleshooting

If the generator exits with
`error: Something else already exists at ... ` you can try running it with the `--force` option (at your own risk!)

Some records from relations/associations are missing? Sails has a default limit of 30 records per relation when populating. Try increasing the limit as a work-around until a pagination solution exists.

### Ember RESTAdapter

If you're using [Ember CLI](//ember-cli.com), you only need to setup the RESTAdapter as the application adapter.
( You can also use it for specific models only. )

In your Ember project: app/adapters/application.js

	export default DS.RESTAdapter.extend( {
	  coalesceFindRequests: true,   // these blueprints support coalescing (reduces the amount of requests)
	  namespace: '/',               // same as API prefix in Sails config
	  host: 'http://localhost:1337' // Sails server
	} );



### Create with current user

If you have logged in users and you always want to associate newly created records with the current user, take a look at the Policy described here: [beforeCreate policy](https://gist.github.com/mphasize/a69d86b9722ea464deca)

### More access control

If you need more control over inclusion and exclusion of records in the blueprints or you want to do other funny things, quite often a Policy can help you achieve this without a need for modifying the blueprints. Here's an example of a Policy that adds *beforeFind*, *beforeDestroy*, etc... hooks to a model: [beforeBlueprint policy](https://gist.github.com/mphasize/e9ed62f9d139d2152445)

### Sideloading records

(*basic* blueprints only!)

The `emberizeJSON` method in *actionUtil.js* can transform your populated *embedded* records into sideloaded records, but you have to decide when is the right time to do this depending on your API needs.

To enable this behavior, add the following lines to the `config/blueprints.js` file:

```
// config/blueprints.js
module.exports.blueprints = {
  // existing configuration
  // ...

  ember: {
    sideload: true
  }
}
```

### Accessing the REST interface without Ember Data

If you want to access the REST routes with your own client or a tool like [Postman](http://www.getpostman.com/) you may have to set the correct HTTP headers:

    Accept: application/json
    Content-Type: application/json

Furthermore Ember Data expects the JSON responses from the API to follow certain conventions.
Some of these conventions are mentioned in the [Ember model guide](http://emberjs.com/guides/models/connecting-to-an-http-server/).
However, there is a more [complete list of expected responses](https://stackoverflow.com/questions/14922623/what-is-the-complete-list-of-expected-json-responses-for-ds-restadapter) on Stackoverflow.

As a **quick example**, if you create a `post` model under the namespace `api/v1` you can access the model under `localhost:1337/api/v1/posts` and to create a new Record send a POST request using the following JSON:

```js
{
  "post": {
    "title": "A new post"
    "content": "This is the wonderful content of this new post."
  }
}
```


# Todo

### Generator: Improve installation

- setup configuration while running the generator

### Blueprints: Support pagination metadata

- the **advanced** blueprints support pagination meta data on direct requests. However, sideloaded records from relationships are currently not paginated.

### Testing: Make the blueprints testable

I am still trying to figure out how to make these blueprints more maintainable and testable.

# Scope

The blueprints in this repository should provide a starting point for a Sails backend that works with an Ember frontend app. However, there are a lot of things missing that would be needed for a full blown app (like authentication and access control) but these things don't really fit into the blueprints.


# Sane Stack

@artificialio used these blueprints to create the first version of their Docker-based [Sane Stack](http://sanestack.com/).
