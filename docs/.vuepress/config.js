module.exports = {
  title: 'epicgames-client',
  description: 'Unofficial EpicGames Client for Node.js',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Changelog', link: '/Changelog.html' },
      { text: 'Github', link: 'https://github.com/SzymonLisowiec/node-epicgames-client' },
    ],
    sidebar: {

      '/': [
        '',
        'Client',
        'Account',
        'Communicator',
        'Friend',
        'Party',
        'PartyMember',
        'EPlatform',
        'EInputType',
        'EUserState',
        'EPartyPrivacy',
      ],

    },
  },
  ga: 'UA-82229950-5',
};
