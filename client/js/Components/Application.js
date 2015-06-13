'use strict';

var React = require('react');

var Panel =  React.createFactory(require('./Panel.js'));


module.exports = React.createClass({

    getInitialState: function(){
        return {
            broadcasting: true
        };
    },


    render: function() {
        var self = this;
        var props = this.props;
        var state = this.state;
        
        var panel = new Panel({
            onBroadcastButtonClick: function(state){
                props.toggleBroadcast(state);
                self.setState({broadcasting: state});                
            }
        });

        return React.DOM.div({id: 'app'},
            panel
        );

    }
});
