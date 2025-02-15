/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

var Message = require('../core/Message');
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var ActionClient = require('./ActionClient');

/**
 * An actionlib goal that is associated with an action server.
 *
 * Emits the following events:
 *  * 'timeout' - If a timeout occurred while sending a goal.
 */
class Goal extends EventEmitter2 {
  /**
   * @param {Object} options
   * @param {ActionClient} options.actionClient - The ROSLIB.ActionClient to use with this goal.
   * @param {Object} options.goalMessage - The JSON object containing the goal for the action server.
   */
  constructor(options) {
    super();
    var that = this;
    this.actionClient = options.actionClient;
    this.goalMessage = options.goalMessage;
    this.isFinished = false;
    this.status = undefined;
    this.result = undefined;
    this.feedback = undefined;

    // Used to create random IDs
    var date = new Date();

    // Create a random ID
    this.goalID = 'goal_' + Math.random() + '_' + date.getTime();
    // Fill in the goal message
    this.goalMessage = new Message({
      goal_id: {
        stamp: {
          secs: 0,
          nsecs: 0
        },
        id: this.goalID
      },
      goal: this.goalMessage
    });

    this.on('status', function (status) {
      that.status = status;
    });

    this.on('result', function (result) {
      that.isFinished = true;
      that.result = result;
    });

    this.on('feedback', function (feedback) {
      that.feedback = feedback;
    });

    // Add the goal
    this.actionClient.goals[this.goalID] = this;
  }
  /**
   * Send the goal to the action server.
   *
   * @param {number} [timeout] - A timeout length for the goal's result.
   */
  send(timeout) {
    var that = this;
    that.actionClient.goalTopic.publish(that.goalMessage);
    if (timeout) {
      setTimeout(function () {
        if (!that.isFinished) {
          that.emit('timeout');
        }
      }, timeout);
    }
  }
  /**
   * Cancel the current goal.
   */
  cancel() {
    var cancelMessage = new Message({
      id: this.goalID
    });
    this.actionClient.cancelTopic.publish(cancelMessage);
  }
}

module.exports = Goal;
