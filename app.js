const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const IMDB = require('./src/imdb')
const DENZEL_IMDB_ID = 'nm0000243';
const CONNECTION_URL = "mongodb+srv://hcayrol:posifonsdey.94@cluster0-coi6p.mongodb.net/test?retryWrites=true";
const DATABASE_NAME = "Denzel";
const { GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
	GraphQLList
} = require('graphql');
const _ = require('lodash');
const graphqlHTTP = require('express-graphql');
const {GraphQLSchema} = require('graphql');
const movie= require('./type').movie;




var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var database, collection;


app.listen(9292, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("movie");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

async function populate(actor) {
	const imdb= await IMDB(actor);
	 
	imdb.forEach(function(objet){    
 collection.insert(objet, null, function (error, results) {
    if (error) throw error;
	
	 });
  });
}  

app.get("/movie/populate", (request, response) => {
	populate(DENZEL_IMDB_ID);
	response.status(200).json({
		message :'data stored!'
	});
		
});
    app.get("/movie/deleteall", (request, response) => {
	collection.deleteMany({},function(err, obj) {
    if (err) throw err;
   response.status(200).json({
		message :'données supprimées.'
	   });
	});
		
});
app.get("/movies",(request,response) =>{
	
	
	collection.aggregate([ {$match : {metascore : {$gt:70} }},{ $sample: { size: 1 }}]).toArray((error, result) =>{
		if(error){
			return response.status(200).send(error);
		}
		response.send(result);
	});	
});

app.get("/movie/:id",(request,response) =>{
	collection.find({"id":request.params.id}).toArray((error,result) =>{
		if(error){
			return response.status(200).send(error);
		}
		response.send(result);
	});	
}); 

app.get("/movie/search/:limit?/:metascore?",(request,response,next) =>{
	var limit=request.params.limit;
    var metascored=request.params.metascore;
	var lim = parseInt(limit, 10);
	var metascore = parseInt(metascored, 10);
    
	if (isNaN(lim)) { lim=null };
	if (isNaN(metascore)) { metascore=null };
	if(lim==undefined)
	{
		lim=5;
	}
	if(metascore==undefined)
	{
		metascore=0;
	}
	var query = { "metascore":{$gte:metascore} };
	var mysort = { metascore: -1 };
	
	collection.find(query).limit(lim).sort(mysort).toArray((error,result) =>{
		if(error){
			return response.status(200).send(error);
		}
		response.send(result);
	});	
}); 

   app.post("/movie/:id", (request, response) => {
            req=request.body;
            collection.updateOne({id:request.params.id},{$set:{date:req.date,review:req.review}},(error, result) => {           
                if(error) {
                    return response.status(500).send(error);
                }           
                response.send(result)          
            });
        });  
		
//partie graphql	
		
		
		const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        hello: {
            type: GraphQLString,

            resolve: function () {
                return "Hello World";
            }
        },
        populate:{
          type: GraphQLString,
          resolve: async () => {
            const movies = await IMDB(DENZEL_IMDB_ID);
            collection.insertMany(movies, (error, result) => {
                if(error) {
                    return response.status(500).send(error);
                }

            });
            return "la database mongodb a ete rempli!";
          }
        },

        randomMovie:{
          type: movie,
          resolve: async () => {
                  const sol = await collection.aggregate([{ $match: { "metascore": {$gt:70}}}, { $sample: { size: 1 }}]).toArray()
                  return sol[0];
          },
        },     

        findMovie:{
          type: movie,
          args:{
            id: { type: GraphQLString }
          },
          resolve: async (source, args) => {
            let res =  await collection.findOne({id : args.id});

            return res;
          }
        },
        search:{
          type: GraphQLList(movie),
          args:{
            limit: {type : GraphQLInt},
            metascore: {type : GraphQLInt}
          },
          resolve : async (source, args) => {
                let metascore;
                let limit;
                if(args.limit == undefined) {
                  limit = 5
                } else {
                  limit = args.limit;
                }
                if(args.metascore == undefined) {
                  metascore = 0
                }else {
                  metascore = args.metascore;
                }
				var query = { "metascore":{$gte:metascore} };
	            var mysort = { metascore: -1 };
	
	            
                const res = await collection.find(query).limit(limit).sort(mysort).toArray()
                return res
              }
        },
        review_date:{
          type:GraphQLString,
          args:{
            id: {type : GraphQLString},
            date:{type : GraphQLString},
            review:{type : GraphQLString}
          },
          resolve : async (source,args) =>{
            collection.updateOne({ "id": args.id },{$set : {"date": args.date , "review": args.review}}, (error, result) => {
              if(error) {
                  return response.status(500).send(error);
              }
          });
          return " ajout d'une date et d'une review : fait ";
          }
        }

    }
});
		
		
const schema = new GraphQLSchema({ query: queryType });





//Setup the nodejs GraphQL server
app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true,
}));





console.log(`GraphQL Server Running at localhost: 9292`);

      
