import * as React from 'react';

import { MetatagNames } from '../constants';


export class HTML extends React.PureComponent {
  render() {
    // figure out someway to put '<!DOCTYPE html>' at the top of this
    return (
      <html>
        {this.props.children}
      </html>
    );
  }
}


export interface HeadProps {
  metatags: Array<MetatagProps>,
}

export class Head extends React.PureComponent<HeadProps> {
  render() {
    const { metatags } = this.props;

    return (
      <head>
        {this.props.children}
        {metatags.map(({name, content}) => <Metatag name={name} content={content}/>)}
      </head>
    );
  }
}

export class Body extends React.PureComponent {
  render() {
    return (
      <body>
        {this.props.children}
      </body>
    );
  }
}


export interface MetatagProps {
  name: string,
  content: string,
}

export class Metatag extends React.PureComponent<MetatagProps> {
  render() {
    const { name, content } = this.props;

    switch (name) {
      case MetatagNames.CHARSET: {
        const properties: any = {charset: content};
        return <meta {...properties}/>;
      };
      case MetatagNames.FAVICON: {
        return <link rel='icon' href={content}/>;
      };
      case MetatagNames.TITLE: {
        return <title>{content}</title>;
      };
    }
    return <meta name={name} content={content}/>;
  }
}
