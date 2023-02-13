/* @refresh reload */
import { render } from "solid-js/web";


import 'bootstrap/scss/bootstrap.scss';



import './css/googlefonts.scss'

import './css/katex.min.css'
import 'github-markdown-css/github-markdown-light.css';

import './css/custom_admonitions.scss'
import './css/custom.scss';

//https://github.com/prismjs/prism-themes#readme
import './css/prism-themes/themes/prism-coldark-dark.css'
import App from './App';


render(() => <App />, document.getElementById("root") as HTMLElement);
