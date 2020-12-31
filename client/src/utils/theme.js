import { red } from '@material-ui/core/colors';
import { createMuiTheme } from '@material-ui/core/styles';

// A custom theme for this app
const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#da2c01',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#fcfcfc',
    },
  },
});

export default theme;