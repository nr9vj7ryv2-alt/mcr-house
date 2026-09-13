// MCR Search Index
// Each entry: title, short description snippet, room label, and the page URL to link to.
const MCR_SEARCH_INDEX = [
  // Creative Room
  { title: "Leaf Rubbing Art", desc: "Reveal a leaf's texture using paper and crayon.", room: "Creative Room", url: "creative-room.html" },
  { title: "Pumpkin Patch Counting", desc: "Counting and simple math with mini pumpkins.", room: "Creative Room", url: "creative-room.html" },
  { title: "Printables: Salt Painting Pack", desc: "Ready-to-use printable art activity.", room: "Creative Room", url: "creative-room.html" },
  { title: "Spin Art", desc: "Colorful spinning art exploring motion and symmetry.", room: "Creative Room", url: "creative-room.html" },
  { title: "Paper Plate Animal Masks", desc: "Craft animal masks from paper plates.", room: "Creative Room", url: "creative-room.html" },
  { title: "Tissue Paper Suncatcher", desc: "A colorful window decoration craft.", room: "Creative Room", url: "creative-room.html" },
  { title: "Recycled Robot Challenge", desc: "Build a robot from recycled materials.", room: "Creative Room", url: "creative-room.html" },
  { title: "More Inspiration (Arts & Crafts Links)", desc: "Outside blogs for arts & crafts ideas.", room: "Creative Room", url: "creative-room.html" },

  // Learning Room
  { title: "Letter Hunt", desc: "Printable grids to circle a target letter.", room: "Learning Room", url: "learning-room.html" },
  { title: "Tracing Practice", desc: "A–Z tracing workbook, uppercase and lowercase.", room: "Learning Room", url: "learning-room.html" },
  { title: "Weekly Story Time Guide", desc: "Pick books and discuss them together.", room: "Learning Room", url: "learning-room.html" },
  { title: "Build-a-Story Cards", desc: "Invent stories from character, place, and object cards.", room: "Learning Room", url: "learning-room.html" },
  { title: "Vocabulary Word of the Week", desc: "Learn and use a new word each week.", room: "Learning Room", url: "learning-room.html" },
  { title: "Shape & Color Matching", desc: "Match paper shapes to names and objects.", room: "Learning Room", url: "learning-room.html" },
  { title: "Pattern Practice", desc: "Continue simple repeating patterns.", room: "Learning Room", url: "learning-room.html" },
  { title: "Counting Practice", desc: "Practice counting and math with everyday objects.", room: "Learning Room", url: "learning-room.html" },
  { title: "Weekly Review Checklist", desc: "Track skills your child practiced each week.", room: "Learning Room", url: "learning-room.html" },

  // Play Room - Scavenger Hunts
  { title: "Movie & Music Hunt #1", desc: "Scavenger hunt: Slow and Steady Wins the Race.", room: "Play Room", url: "play-room.html" },
  { title: "Superhero & Musical Theater Hunt", desc: "Scavenger hunt: Actions Speak Louder Than Words.", room: "Play Room", url: "play-room.html" },
  { title: "Adventure & Classic Rock Hunt", desc: "Scavenger hunt: Every Cloud Has a Silver Lining.", room: "Play Room", url: "play-room.html" },
  { title: "Animated Movie & Pop Music Hunt", desc: "Scavenger hunt: The Early Bird Catches the Worm.", room: "Play Room", url: "play-room.html" },
  { title: "History & Classical Music Hunt", desc: "Scavenger hunt: Rome Wasn't Built in a Day.", room: "Play Room", url: "play-room.html" },
  { title: "Listening Hunt #1", desc: "Audio-only scavenger hunt for blind/low-vision players.", room: "Play Room", url: "play-room.html" },
  { title: "Listening Hunt #2", desc: "Audio-only scavenger hunt for blind/low-vision players.", room: "Play Room", url: "play-room.html" },
  { title: "Listening Hunt #3", desc: "Audio-only scavenger hunt for blind/low-vision players.", room: "Play Room", url: "play-room.html" },
  { title: "Listening Hunt #4", desc: "Audio-only scavenger hunt for blind/low-vision players.", room: "Play Room", url: "play-room.html" },
  { title: "Listening Hunt #5", desc: "Audio-only scavenger hunt for blind/low-vision players.", room: "Play Room", url: "play-room.html" },
  // Play Room - Family Challenges
  { title: "The Compliment Circle", desc: "Family sits in a circle giving compliments.", room: "Play Room", url: "play-room.html" },
  { title: "Blindfolded Trust Walk", desc: "Guide a blindfolded partner through an obstacle course.", room: "Play Room", url: "play-room.html" },
  { title: "The Human Knot", desc: "A classic teamwork untangling puzzle.", room: "Play Room", url: "play-room.html" },
  { title: "Family Time Capsule Challenge", desc: "Write hopes and memories to open later.", room: "Play Room", url: "play-room.html" },
  { title: "The Silent Line-Up", desc: "Line up by height or birthday, no talking.", room: "Play Room", url: "play-room.html" },
  { title: "Build a Story Challenge", desc: "Build a silly story one sentence at a time.", room: "Play Room", url: "play-room.html" },

  // Parent Room
  { title: "Handling Meltdowns Calmly", desc: "Steps for staying regulated during a meltdown.", room: "Parent Room", url: "parent-room.html" },
  { title: "Positive Redirection Phrases", desc: "Swap 'don't' phrases for clear redirects.", room: "Parent Room", url: "parent-room.html" },
  { title: "Building a Reading Habit", desc: "Small, consistent ways to build daily reading.", room: "Parent Room", url: "parent-room.html" },
  { title: "Screen Time Balance", desc: "Set consistent screen-time limits without battles.", room: "Parent Room", url: "parent-room.html" },
  { title: "Morning Routine Chart", desc: "A simple visual sequence for mornings.", room: "Parent Room", url: "parent-room.html" },
  { title: "Bedtime Wind-Down Routine", desc: "A calming sequence to signal bedtime.", room: "Parent Room", url: "parent-room.html" },
  { title: "Homework Time Setup", desc: "A consistent spot and time for homework.", room: "Parent Room", url: "parent-room.html" },
  { title: "Screen-Free Family Hour", desc: "One device-free hour together each week.", room: "Parent Room", url: "parent-room.html" },
  { title: "Useful Resources (Websites, Organizations, Books)", desc: "Trusted resources on autism, ADHD, disabilities, and early childhood.", room: "Parent Room", url: "parent-room.html" },

  // Family Room
  { title: "Sunday Family Dinner Ritual", desc: "A weekly phone-free dinner with a question of the week.", room: "Family Room", url: "family-room.html" },
  { title: "Yearly Family Photo Tradition", desc: "Same pose, same spot, once a year.", room: "Family Room", url: "family-room.html" },
  { title: "Family Recipe Box", desc: "Collect recipes with memories attached.", room: "Family Room", url: "family-room.html" },
  { title: "Question of the Day Jar", desc: "Conversation-starter questions for car rides or dinner.", room: "Family Room", url: "family-room.html" },
  { title: "Family Game Night Rotation", desc: "Everyone takes a turn picking the game.", room: "Family Room", url: "family-room.html" },
  { title: "Parent-Child One-on-One Dates", desc: "Scheduled one-on-one time with each child.", room: "Family Room", url: "family-room.html" },
  { title: "Monthly Family Outing", desc: "Explore one new place together each month.", room: "Family Room", url: "family-room.html" },
  { title: "Memory Wall or Scrapbook", desc: "An ongoing collage of family memories.", room: "Family Room", url: "family-room.html" },
  { title: "Celebrating Small Wins", desc: "A ritual for celebrating good days and wins.", room: "Family Room", url: "family-room.html" },

  // Kindness Corner
  { title: "How to Offer Help to a Blind or Low-Vision Person", desc: "Ask first, offer your elbow, give clear directions.", room: "Kindness Corner", url: "kindness-corner.html" },
  { title: "Understanding Guide Dogs & Service Animals", desc: "Never distract a working service dog.", room: "Kindness Corner", url: "kindness-corner.html" },
  { title: "What Floor Patterns Mean to a Blind Person", desc: "Tactile paving: bumps warn, lines guide the path.", room: "Kindness Corner", url: "kindness-corner.html" },
  { title: "Guiding Someone Safely to a Train or Bus", desc: "Describe the path and help find a seat.", room: "Kindness Corner", url: "kindness-corner.html" },
  { title: "Communicating with Someone Who is Deaf or Hard of Hearing", desc: "Face them, speak normally, offer to write.", room: "Kindness Corner", url: "kindness-corner.html" },
  { title: "Supporting Someone Who Uses a Wheelchair", desc: "Ask before touching the wheelchair, speak directly to them.", room: "Kindness Corner", url: "kindness-corner.html" },
  { title: "Gratitude Before Bed", desc: "Share one thing you were grateful for today.", room: "Kindness Corner", url: "kindness-corner.html" },
  { title: "Empathy Check-In Questions", desc: "Prompts to practice perspective-taking.", room: "Kindness Corner", url: "kindness-corner.html" },
  { title: "Family Kindness Journal", desc: "A shared notebook of kind things noticed.", room: "Kindness Corner", url: "kindness-corner.html" },
  { title: "Compliment Chain", desc: "Give compliments around the circle.", room: "Kindness Corner", url: "kindness-corner.html" },
  { title: "Surprise Kindness Notes", desc: "Hide encouraging notes in a lunchbox or backpack.", room: "Kindness Corner", url: "kindness-corner.html" },
  { title: "Community Helper Day", desc: "Help a neighbor or local shelter together.", room: "Kindness Corner", url: "kindness-corner.html" }
];
