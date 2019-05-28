module.exports = {
  title: 'epicgames-client',
  description: 'Unofficial EpicGames Client for Node.js',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
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
      ],

    },
  },
};
