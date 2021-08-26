// Please run command:
// yarn install
// yarn start
// go to http://localhost:5000/graphql
// and use the below provided queries

const express = require("express");

const balanceScript = require("./scripts/balanceScript.js");
const generateSignatureScript = require("./scripts/generateSignatureScript.js");

const { graphqlHTTP } = require("express-graphql");
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
} = require("graphql");
const app = express();

// I created wallets using: https://vanity-eth.tk/
// obvisouly we would never take or store private keys from anyone
// this is just for showcase purpose that it works!

// the users array imitates a db
let users = [
  {
    id: 1,
    name: "Ben.Eth",
    publicAddress: "0xa0d8Bc786c128465d29Beaf767AA8baA966297fc",
    privateKey:
      "78f2434a95d80bb2fba4a8ea5ab6ec636c9a649f8a6b5c329112a4e1cf6493a6",
    nonce: 56354,
  },
  {
    id: 2,
    name: "Thomas.Eth",
    publicAddress: "0xaCA5dC0885FeCBafA098951268816CB012a1dc64",
    privateKey:
      "73e1d6abd6243be76c8788ff9f5a1619befcddbd25598a06d7518e4a972089cd",
    nonce: 134,
  },
  {
    id: 3,
    name: "Peter.Eth",
    publicAddress: "0x2074364125C26a9B3BAc5551428cb382FFD15da9",
    privateKey:
      "5d1fbcfa13cd91e1caf02120e3b54ba305f930118cd2fd9f1368cb88d7643937",
    nonce: 739129,
  },
];

const TokenBalanceType = new GraphQLObjectType({
  name: "TokenBalance",
  description: "This represents the token balance of a public address",
  fields: () => ({
    blockchainNetwork: { type: GraphQLNonNull(GraphQLString) },
    publicAddress: { type: GraphQLNonNull(GraphQLString) },
    tokenBalance: { type: GraphQLString },
    error: { type: GraphQLString },
  }),
});

const UserType = new GraphQLObjectType({
  name: "User",
  description: "This represents a user with public address",
  fields: () => ({
    message: { type: GraphQLString },
    error: { type: GraphQLString },
    name: { type: GraphQLString },
    publicAddress: { type: GraphQLString },
    newNonce: { type: GraphQLInt },
    oldNonce: { type: GraphQLInt },
  }),
});

const RootQueryType = new GraphQLObjectType({
  name: "Query",
  description: "Root Query",
  fields: () => ({
    tokenBalance: {
      type: TokenBalanceType,
      description: "The token balance of a public address",
      args: {
        blockchainNetwork: {
          type: GraphQLNonNull(GraphQLString),
        },
        publicAddress: {
          type: GraphQLNonNull(GraphQLString),
        },
      },
      // QUERY FOR ETH BLOCKCHAIN:
      // query {
      //   tokenBalance(blockchainNetwork: "ethMainnet", publicAddress:"0x0037de80c88f1e53cab86668e9e8ccb626e11a96") {
      //     publicAddress, tokenBalance, blockchainNetwork, error
      //   }
      // }

      // QUERY FOR BSC BLOCKCHAIN: NOTE: blockchainNetwork must just be different than "ethMainnet"
      // query {
      //   tokenBalance(blockchainNetwork: "bscMainnet", publicAddress:"0x0037de80c88f1e53cab86668e9e8ccb626e11a96") {
      //     publicAddress, tokenBalance, blockchainNetwork, error
      //   }
      // }
      resolve: (parent, arg) => {
        return balanceScript(arg.blockchainNetwork, arg.publicAddress);
      },
    },
  }),
});

const RootMutationType = new GraphQLObjectType({
  name: "Mutation",
  description: "Root Mutation",
  fields: () => ({
    verifyOwnershipOfWallet: {
      type: UserType,
      description: "Verify ownership of wallet and change nonce of user",
      args: {
        publicAddress: {
          type: GraphQLNonNull(GraphQLString),
        },
      },
      // MUTATION QUERY
      // mutation {
      //   verifyOwnershipOfWallet(publicAddress: "0xa0d8Bc786c128465d29Beaf767AA8baA966297fc") {
      //     message, error, publicAddress, oldNonce, newNonce, name
      //   }
      // }

      resolve: async (parent, arg) => {
        // find user in database
        const userObject = users.find(
          (user) => user.publicAddress === arg.publicAddress
        );

        if (userObject) {
          const { privateKey, nonce, publicAddress, name } = userObject;

          // generate signature with privatekey and nonce from user
          const signature = await generateSignatureScript(privateKey, nonce);

          if (signature.error) {
            return { error: "Something went wrong generating users signature" };
          }

          const extractedPublicAddressFromSignatureAndMessage = await web3Eth.eth.accounts.recover(
            signature
          );

          if (extractedPublicAddressFromSignatureAndMessage !== publicAddress) {
            return {
              error: `User with public address: ${arg.publicAddress} failed the signature verification!`,
            };
          } else {
            // update nonce to prevent user from logging in again with same signature for the edge-case wallet gets compromised
            const newNonce = Math.floor(Math.random() * 1000000);

            users = users.map((userObject) => {
              if (userObject.publicAddress === publicAddress) {
                userObject["nonce"] = newNonce;
              }
              return userObject;
            });

            return {
              name,
              publicAddress,
              newNonce,
              oldNonce: nonce,
              message: `User with public address: ${arg.publicAddress} verified ownership!`,
            };
          }
        } else {
          return {
            error: `User with public address: ${arg.publicAddress} not found!`,
          };
        }
      },
    },
  }),
});

const schema = new GraphQLSchema({
  query: RootQueryType,
  mutation: RootMutationType,
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    graphiql: true,
  })
);

app.listen(5000, () => console.log("Server Running"));
