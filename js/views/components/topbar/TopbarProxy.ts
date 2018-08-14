import * as React from 'react';
import { Component } from 'react';
import {TopbarStateContainer} from "../../../logic/TopbarStateContainer";

export class TopbarProxy extends Component<{
  id: string,
  [proptype: string]: any
}, any> {

  constructor(props) {
    super(props)

    TopbarStateContainer.addProxy(props.id, props);
    this.props.navigation.setParams({xtitle:"test" + (Math.ceil(Math.random()*1000)).toString(36)})
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    TopbarStateContainer.updateProxy(this.props.id, this.props)
  }

  componentWillUnmount() {
    TopbarStateContainer.removeProxy(this.props.id)
  }


  render() {
    return null;
  }
}
