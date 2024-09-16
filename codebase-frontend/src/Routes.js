import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import Documentation from './pages/Documentation';
import ApiExplorer from './pages/ApiExplorer';

const Routes = () => (
  <Router>
    <Switch>
      <Route exact path="/" component={Home} />
      <Route path="/documentation" component={Documentation} />
      <Route path="/api-explorer" component={ApiExplorer} />
    </Switch>
  </Router>
);

export default Routes;