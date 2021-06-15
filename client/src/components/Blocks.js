import React, { Component } from "react";
import { Button } from "react-bootstrap";
import Block from "./Block";
import { Link } from "react-router-dom";

class Blocks extends Component {
  state = { blocks: [], paginatedid: 1, blocksLength: 0 };
  componentDidMount() {
    fetch(`${document.location.origin}/api/blocks/length`)
      .then((response) => response.json())
      .then((json) => this.setState({ blocksLength: json }));
    this.fetchPaginatedBlocks(this.state.paginatedid)();
  }

  fetchPaginatedBlocks = (paginatedid) => () => {
    fetch(`${document.location.origin}/api/blocks/${paginatedid}`)
      .then((response) => response.json())
      .then((json) => this.setState({ blocks: json }));
  };

  render() {
    console.log("this.state", this.state);

    return (
      <div>
        <div>
          <Link to="/">Home</Link>
        </div>
        <h3>Blocks</h3>
        <div>
          {
            [...Array(Math.ceil(this.state.blocksLength/5)).keys()].map(key => {
              const paginatedid = key + 1;
              return(
                <span key={key} onClick={this.fetchPaginatedBlocks(paginatedid)}>
                  <Button bsSize="small" bsStyle="danger">
                    {paginatedid}
                  </Button>{' '}
                </span>
              )
            })
          }
        </div>
        {this.state.blocks.map((block) => {
          return <Block key={block.hash} block={block} />;
        })}
      </div>
    );
  }
}

export default Blocks;
