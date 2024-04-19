const Friendship = require('./friendships');

async function areFriends(user1Id, user2Id) {
  try {
    // Check if there exists a friendship record where user1 is user1 and user2 is user2, and the status is "accepted"
    const friendship = await Friendship.findOne({
      $or: [
        { user1: user1Id, user2: user2Id },
        { user1: user2Id, user2: user1Id }
      ],
      status: 'accepted'
    });

    // If a friendship record is found, return true
    return !!friendship;
  } catch (error) {
    // Handle errors
    console.error(error);
    return false;
  }
}

// Example usage:
const user1Id = '...'; // User1's ObjectId
const user2Id = '...'; // User2's ObjectId

areFriends(user1Id, user2Id)
  .then(result => {
    if (result) {
      console.log("User1 and User2 are friends.");
    } else {
      console.log("User1 and User2 are not friends.");
    }
  })
  .catch(error => {
    console.error("Error:", error);
  });
