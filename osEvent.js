require("dotenv").config();
const { Client, MessageEmbed } = require("discord.js");
const fetch = require("node-fetch");
const CHANNEL_TRADE = process.env.CHANNEL_TRADE;
const TIMER = process.env.TIMER;
const Web3 = require("web3");

let web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
var _bot;

function sendMessage(embed) {
  _bot.channels.cache.get(CHANNEL_TRADE).send(embed);
}

String.prototype.trunc = function (n, useWordBoundary) {
  console.log(this);
  var isTooLong = this.length > n,
    s_ = isTooLong ? this.substr(0, n - 1) : this;
  s_ = useWordBoundary && isTooLong ? s_.substr(0, s_.lastIndexOf(" ")) : s_;
  return isTooLong ? s_ : s_;
};

function safeGet(path, object) {
	return path.reduce((object, key) => (object && object[key]) ?  object[key] : null, object);
}

function checkNull(val) {
  if (val) {
    if (val === "null") {
      return "";
    } else {
      return val;
    }
  } else {
    return "";
  }
}

async function embed(details) {
  const _embed = new MessageEmbed()
    // Set the title of the field
    .setTitle(details.event_type)

    .setDescription(
      `[${
        safeGet(["data", "asset", "name"], details)
      }](${`https://artblocks.io/token/${safeGet(["data", "asset", "token_id"], details)}`}) ${
        details.event_description
      }`
    )

    .setURL(safeGet(["data", "asset", "permalink"], details))
    // Set the color of the embed
    .setColor(details.color)
    // Set the main content of the embed

    .setThumbnail(safeGet(["data", "asset", "image_url"], details))
    .addFields({ name: details.name, value: details.value });
  sendMessage(_embed);
}

const eventType = async (event) => {
  let details = {};
  switch (event.event_type) {
    case "created":
      //console.log(event, "Created");
      if (event.asset == null) {
        console.log(event.name, "BUNDLE HERE");

        break;
      }
      details = {
        event_type: `New Listing`,
        event_description: "has been listed for sale.",
        color: "#0062FF",
        name: "Offered At",
        value: ` ${web3.utils.fromWei(
          event.starting_price,
          "ether"
        )}Ξ by [${event.from_account.address.slice(
          0,
          8
        )}](https://opensea.io/accounts/${event.from_account.address}) ${
          event.from_account.user !== null
            ? `(${checkNull(event.from_account.user.username).trunc(8, false)})`
            : ""
        } on ${new Date(event.created_date).toLocaleDateString()}`,
        inline: true,
        data: event,
      };
      embed(details);
      break;
    case "successful":
      //console.log(event, "Successful");
      details = {
        event_type: `New Sale`,
        event_description: "has been sold to a new owner, congrats!",
        color: "#23FF00",
        name: "Last Sale",
        value: `Sold for ${web3.utils.fromWei(
          event.total_price,
          "ether"
        )}Ξ on ${new Date(event.created_date).toLocaleDateString()}`,
        inline: true,
        data: event,
      };
      embed(details);
      break;
    case "bid_entered":
      //console.log(event, "BID ENTERED");
      details = {
        event_type: `New Bid`,
        event_description: "has a new bid.",
        color: "#FFA300",
        name: "Current Bid",
        value: ` ${web3.utils.fromWei(
          event.bid_amount,
          "ether"
        )}Ξ from [${event.from_account.address.slice(
          0,
          8
        )}](https://opensea.io/accounts/${event.from_account.address}) ${
          event.from_account.user !== null
            ? `(${checkNull(event.from_account.user.username).trunc(8, false)})`
            : ""
        }  on ${new Date(event.created_date).toLocaleDateString()}`,
        inline: true,
        data: event,
      };
      embed(details);
      break;
    case "bid_withdrawn":
      //console.log(event, "bid_withdrawn");

      details = {
        event_type: `Bid Withdrawn`,
        event_description: "bid has been withdrawn.",
        color: "#FFDB00",
        name: "Bid Withdrawn",
        value: ` ${web3.utils.fromWei(
          event.total_price,
          "ether"
        )}Ξ from [${event.from_account.address.slice(
          0,
          8
        )}](https://opensea.io/accounts/${event.from_account.address}) ${
          event.from_account.user.username !== null
            ? `(${checkNull(event.from_account.user.username).trunc(8, false)})`
            : ""
        }  on ${new Date(event.created_date).toLocaleDateString()}`,
        inline: true,
        data: event,
      };

      embed(details);
      break;
    case "cancelled":
      //console.log(event, "Cancelled");
      details = {
        event_type: `Listing Cancelled`,
        event_description: "has been removed from listings.",
        color: "#FF000A",

        name: "Cancelled Offer",
        value: `[${event.seller.address.slice(
          0,
          8
        )}](https://opensea.io/accounts/${event.seller.address}) ${
          safeGet(["seller", "user", "username"], event) !== null || "NULL"
            ? `(${safeGet(["seller", "user", "username"], event)})`
            : `(${event.seller.user.address.slice(0, 8)})`
        }  has withdrawn their bid on ${new Date(
          event.created_date
        ).toLocaleDateString()}`,
        inline: true,
        data: event,
      };
      embed(details);
      break;
    case "offer_entered":
      //console.log(event, "OFFER ENTERED");
      //console.log(safeGet(["seller", "user", "username"], event), "USER NAME");
      details = {
        event_type: `New Bid`,
        event_description: "has a new bid.",
        color: "#FFA300",
        name: "Current Bid",
        value: ` ${web3.utils.fromWei(
          event.bid_amount,
          "ether"
        )}Ξ from [${event.from_account.address.slice(
          0,
          8
        )}](https://opensea.io/accounts/${event.from_account.address}) ${
          event.from_account.user !== null
            ? `(${checkNull(event.from_account.user.username).trunc(8, false)})`
            : ""
        }  on ${new Date(event.created_date).toLocaleDateString()}`,
        inline: true,
        data: event,
      };
      embed(details);
      break;
    case "transfer":
      break;
    default:
      console.log(event, "HIT BOTTOM OF CASE");
  }
};

async function openseaEvent(bot) {
  _bot = bot;
  var aMinuteAgo = new Date(Date.now() - 1000 * TIMER);
  console.log(aMinuteAgo, "AGO");

  await fetch(
    "https://api.opensea.io/api/v1/events?only_opensea=false&asset_contract_address=0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270&offset=0&limit=200&occurred_after=" +
      Date.parse(aMinuteAgo)
  )
    .then((response) => response.json())
    .then(async (data) => {
      //   console.log(data);
      if (data.asset_events.length > 0) {
        // console.log(data.asset_events);

        data.asset_events.map(async (data) => {
          eventType(data);
        });
      } else {
        console.log("no changes");
      }
    })
    .catch((err) => {
      console.error(err);
    });
}

module.exports = { openseaEvent };
