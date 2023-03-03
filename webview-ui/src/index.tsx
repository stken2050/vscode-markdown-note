/* @refresh reload */
import { render } from "solid-js/web";


import 'bootstrap/scss/bootstrap.scss';


import 'github-markdown-css/github-markdown-light.css';

import './css/custom_admonitions.scss'
import './css/custom.scss';

//https://github.com/prismjs/prism-themes#readme
import './css/prism-coldark-dark.min.css'

import katex from 'katex';

import App from './App';


render(() => <App />, document.getElementById("root") as HTMLElement);
