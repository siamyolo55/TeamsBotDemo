const axios = require("axios");
const querystring = require("querystring");
const { TeamsActivityHandler, CardFactory, TurnContext} = require("botbuilder");
const rawWelcomeCard = require("./adaptiveCards/welcome.json");
const rawLearnCard = require("./adaptiveCards/learn.json");
const cardTools = require("@microsoft/adaptivecards-tools");

class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();

    // record the likeCount
    this.likeCountObj = { likeCount: 0 };
    this.startTime = null
    this.timeToLeave = null
    this.leaveTime = null
    this.loggedIn = false
    this.pause = false
    this.breakStartTime = null
    this.breakTimes = []

    this.onMessage(async (context, next) => {
      console.log("Running with Message Activity.");
      let txt = context.activity.text;
      const removedMentionText = TurnContext.removeRecipientMention(
        context.activity
      );
      if (removedMentionText) {
        // Remove the line break
        txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
      }

      // Trigger command by IM text
      switch (txt) {
        case "welcome": {
          const card = cardTools.AdaptiveCards.declareWithoutData(rawWelcomeCard).render();
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
          break;
        }
        case "learn": {
          this.likeCountObj.likeCount = 0;
          const card = cardTools.AdaptiveCards.declare(rawLearnCard).render(this.likeCountObj);
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
          break;
        }
        case "who's this?": {
            await context.sendActivity('KONO DIA DA!');
            break;
        }
        case "login":{
          if(this.loggedIn == true){
            await context.sendActivity(`You've already logged in`)
            break
          }

          const OFFICE_HOURS = 8
          this.startTime = new Date()
          let hour = String(this.startTime.getHours())
          hour.length == 1 ? '0'+ hour : hour = hour
          let min = String(this.startTime.getMinutes())
          min.length == 1 ? min = '0' + min : min = min
          this.timeToLeave = new Date(this.startTime.getTime() + OFFICE_HOURS * 60000 * 60)
          let startReply = `Morning Siam!,  you started today at ${hour}:${min}`
          await context.sendActivity(startReply)
          await context.sendActivity(`You should leave at around ${this.timeToLeave.getHours()}:${this.timeToLeave.getMinutes()}`)
          this.loggedIn = true
          break
        }
        case "logout":{
          if(this.loggedIn == false){
            await context.sendActivity(`You need to login first`)
            break
          }
          this.leaveTime = new Date()
          let hour = String(this.leaveTime.getHours())
          hour.length == 1 ? '0' + hour : hour = hour
          let min = String(this.leaveTime.getMinutes())
          min.length == 1 ? '0' + min : min = min
          let reply = `You've logged out! Time : ${hour}:${min}`
          await context.sendActivity(reply)

          // checking whether over-time or under-time
          if( this.timeToLeave.getTime() >= this.leaveTime.getTime() ){
            let seconds = (this.timeToLeave.getTime() - this.leaveTime.getTime()) / 1000
            let hours = (seconds - (seconds % 3600)) / 3600 
            let minutes = ((seconds - (seconds % 60)) / 60) % 60

            let reply = `Looks like you worked less today, ${hours*60 + minutes} minutes less.`
            await context.sendActivity(reply)
          }
          else {
            let seconds = (this.leaveTime.getTime() - this.timeToLeave.getTime()) / 1000
            let hours = (seconds - (seconds % 3600)) / 3600 
            let minutes = ((seconds - (seconds % 60)) / 60) % 60 

            let reply = `Looks like you worked more than usual today, ${hours*60 + minutes} minutes more.`
            await context.sendActivity(reply)
          }
          this.loggedIn = false
          break
        }
        case "pause":{
          if(this.loggedIn == false){
            await context.sendActivity(`You need to login first to pause`)
            break
          }
          if(this.pause == true){
            await context.sendActivity(`Already paused`)
            break
          }
          this.breakStartTime = new Date()
          let reply = `Enjoy your break! started at ${this.breakStartTime.getHours()}:${this.breakStartTime.getMinutes()}`
          this.pause = true
          await context.sendActivity(reply)
          break
        }
        case "unpause": {
          if(this.loggedIn == false){
            await context.sendActivity(`You need to login first to unpause`)
            break
          }
          if(this.pause == false){
            await context.sendActivity(`You need to pause first to unpause`)
            break
          }
          let currentTime = new Date()
          let breakSeconds = (currentTime.getTime() - this.breakStartTime.getTime()) / 1000
          let breakMinutes = ((breakSeconds - (breakSeconds % 60)) / 60) + 1
          let reply = `Hope you enjoyed you break, you've taken about ${breakMinutes} minute(s)`
          this.pause = false
          this.breakTimes.push({start: this.breakStartTime, end: currentTime})
          await context.sendActivity(reply)
          break
        }
        case "breaklist" : {
          if(this.breakTimes.length > 0){
            await context.sendActivity(`Here's the list of breaks you've taken today :`)
            let cnt = 0
            this.breakTimes.map(async (breakk) => {
                console.log(breakk)
                await context.sendActivity(`Break ${++cnt}: Start: ${breakk.start.getHours()}:${breakk.start.getMinutes()}, End: ${breakk.end.getHours()}:${breakk.end.getMinutes()}`)
            })
            break
          }
          await context.sendActivity(`You took no break today.`)
          break
        }
        default:{
          // fetching message reply from django backend
          let res = await axios.post('http://127.0.0.1:8000/images/get_bot_response/',{
            message: txt
          })
          //console.log(res.data)
          await context.sendActivity(res.data.message)
          break
        }
      }

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    // Listen to MembersAdded event, view https://docs.microsoft.com/en-us/microsoftteams/platform/resources/bot-v3/bots-notifications for more events
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id) {
          const card = cardTools.AdaptiveCards.declareWithoutData(rawWelcomeCard).render();
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
          break;
        }
      }
      await next();
    });
  }

  // Invoked when an action is taken on an Adaptive Card. The Adaptive Card sends an event to the Bot and this
  // method handles that event.
  async onAdaptiveCardInvoke(context, invokeValue) {
    // The verb "userlike" is sent from the Adaptive Card defined in adaptiveCards/learn.json
    if (invokeValue.action.verb === "userlike") {
      this.likeCountObj.likeCount++;
      const card = cardTools.AdaptiveCards.declare(rawLearnCard).render(this.likeCountObj);
      await context.updateActivity({
        type: "message",
        id: context.activity.replyToId,
        attachments: [CardFactory.adaptiveCard(card)],
      });
      return { statusCode: 200 };
    }
  }

  // Messaging extension Code
  // Action.
  handleTeamsMessagingExtensionSubmitAction(context, action) {
    switch (action.commandId) {
      case "createCard":
        return createCardCommand(context, action);
      case "shareMessage":
        return shareMessageCommand(context, action);
      default:
        throw new Error("NotImplemented");
    }
  }

  // Search.
  async handleTeamsMessagingExtensionQuery(context, query) {
    const searchQuery = query.parameters[0].value;
    const response = await axios.get(
      `http://registry.npmjs.com/-/v1/search?${querystring.stringify({
        text: searchQuery,
        size: 8,
      })}`
    );

    const attachments = [];
    response.data.objects.forEach((obj) => {
      const heroCard = CardFactory.heroCard(obj.package.name);
      const preview = CardFactory.heroCard(obj.package.name);
      preview.content.tap = {
        type: "invoke",
        value: { name: obj.package.name, description: obj.package.description },
      };
      const attachment = { ...heroCard, preview };
      attachments.push(attachment);
    });

    return {
      composeExtension: {
        type: "result",
        attachmentLayout: "list",
        attachments: attachments,
      },
    };
  }

  async handleTeamsMessagingExtensionSelectItem(context, obj) {
    return {
      composeExtension: {
        type: "result",
        attachmentLayout: "list",
        attachments: [CardFactory.heroCard(obj.name, obj.description)],
      },
    };
  }

  // Link Unfurling.
  handleTeamsAppBasedLinkQuery(context, query) {
    const attachment = CardFactory.thumbnailCard("Thumbnail Card", query.url, [query.url]);

    const result = {
      attachmentLayout: "list",
      type: "result",
      attachments: [attachment],
    };

    const response = {
      composeExtension: result,
    };
    return response;
  }
}

function createCardCommand(context, action) {
  // The user has chosen to create a card by choosing the 'Create Card' context menu command.
  const data = action.data;
  const heroCard = CardFactory.heroCard(data.title, data.text);
  heroCard.content.subtitle = data.subTitle;
  const attachment = {
    contentType: heroCard.contentType,
    content: heroCard.content,
    preview: heroCard,
  };

  return {
    composeExtension: {
      type: "result",
      attachmentLayout: "list",
      attachments: [attachment],
    },
  };
}

function shareMessageCommand(context, action) {
  // The user has chosen to share a message by choosing the 'Share Message' context menu command.
  let userName = "unknown";
  if (
    action.messagePayload &&
    action.messagePayload.from &&
    action.messagePayload.from.user &&
    action.messagePayload.from.user.displayName
  ) {
    userName = action.messagePayload.from.user.displayName;
  }

  // This Messaging Extension example allows the user to check a box to include an image with the
  // shared message.  This demonstrates sending custom parameters along with the message payload.
  let images = [];
  const includeImage = action.data.includeImage;
  if (includeImage === "true") {
    images = [
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtB3AwMUeNoq4gUBGe6Ocj8kyh3bXa9ZbV7u1fVKQoyKFHdkqU",
    ];
  }
  const heroCard = CardFactory.heroCard(
    `${userName} originally sent this message:`,
    action.messagePayload.body.content,
    images
  );

  if (
    action.messagePayload &&
    action.messagePayload.attachment &&
    action.messagePayload.attachments.length > 0
  ) {
    // This sample does not add the MessagePayload Attachments.  This is left as an
    // exercise for the user.
    heroCard.content.subtitle = `(${action.messagePayload.attachments.length} Attachments not included)`;
  }

  const attachment = {
    contentType: heroCard.contentType,
    content: heroCard.content,
    preview: heroCard,
  };

  return {
    composeExtension: {
      type: "result",
      attachmentLayout: "list",
      attachments: [attachment],
    },
  };
}

module.exports.TeamsBot = TeamsBot;
