const {
    GraphQLObjectType,
    GraphQLID,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLList
} = require('graphql');

// Define Movie Type
movie = new GraphQLObjectType({
    name: 'Movie',
    fields: {
        _id: { type: GraphQLID },
        link: { type: GraphQLString },
        id: { type: GraphQLString },
        metascore: { type: GraphQLInt },
        poster: { type: GraphQLString },
        rating: { type: GraphQLFloat },
        synopsis: { type: GraphQLString },
        title: { type: GraphQLString },
        votes: { type: GraphQLFloat},
        year: { type: GraphQLInt },
        date:{type: GraphQLString},
        review:{type:GraphQLString}

    }
});

exports.movie = movie;
