Sails-Generate-Ember-Blueprints
======================

`Version 0.0.1`

Ember Data compatible blueprints for Sails v0.10


Since version v0.10 [Sails](http://beta.sailsjs.org/) supports overriding the default blueprints, which gives us a remarkable flexibility in making Sails work together with a variety of clients and frontend libraries.

The blueprints in this repository are meant as a starting point to make Sails work with Ember, Ember Data and the default Ember Data RESTAdapter.

`!` *On August 18th, [Ember Data 1.0 beta-9](http://emberjs.com/blog/2014/08/18/ember-data-1-0-beta-9-released.html) was released, including a lot of improvements for delivering model associations/relations as Embedded Records (instead of Sideloading). Embedding records is much closer to what Sails does orginally, so it might be better to move into that direction. But since the actual JSON API structure is very different for these two approaches and since most APIs will be designed to work with multiple clients, I'd like to see support/alternatives for both ways. If you happen to know a project that will support the embedded style, please send me a note!*


### Ember Data expectations

Ember Data expects the JSON responses from the API to follow certain conventions. 
Some of these conventions are mentioned in the [Ember model guide](http://emberjs.com/guides/models/connecting-to-an-http-server/).
However, there is a more [complete list of expected responses](https://stackoverflow.com/questions/14922623/what-is-the-complete-list-of-expected-json-responses-for-ds-restadapter) on Stackoverflow.



# Getting started


* Install the generator into your (new) Sails project `npm install sails-generate-ember-blueprints`
* Add node dependencies `npm install --save lodash` and `npm install --save pluralize`
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


### Troubleshooting

If the generator exits with 
`error: Something else already exists at ... ` you can try running it with the `
--force` option (at your own risk!)

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

If you have logged in users and you always want to associate newly created records with the current user, take a look at `blueprints/create.js` lines 25-31 and uncomment the code if it fits your needs.

### Sideloading records

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



# Todo

### Generator: Improve installation

- install dependencies while running the generator
- setup configuration while running the generator

### Blueprints: Support pagination metadata

Ember Data supports information about pagination in the form of a `meta` attribute at the top level of the generated JSON response. See description in the [Handling Metadata](http://emberjs.com/guides/models/handling-metadata/) Guide. Supporting this out-of-the-box might be a nice addition for the blueprints.


### Testing: Make the blueprints testable

I am still trying to figure out how to make these blueprints more maintainable and testable.

# Scope

The blueprints in this repository should provide a starting point for a Sails backend that works with an Ember frontend app. However, there are a lot of things missing that would be needed for a full blown app (like authentication and access control) but these things don't really fit into the blueprints.


# Related

This generator is based on the [sails-ember-blueprints](https://github.com/mphasize/sails-ember-blueprints).

@artificialio used these blueprints to create the first version of their Vagrant-based [Sails Ember Starter Kit](https://artificialio.github.io/sane/).
