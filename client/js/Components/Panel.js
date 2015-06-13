'use strict';

var React = require('react');

var BooleanButton =  React.createFactory(require('./BooleanButton.js'));


var Panel = React.createClass({

    getInitialState: function(){
        return {}
    },

    render: function() {
        var self = this;
        var props = this.props;
        var state = this.state;

        var classes = '';

        var controls = [
            new BooleanButton({
                active: true,
                className: "broadcast",
                label: "broadcast",
                onChange: function(nextState){
                    props.onBroadcastButtonClick(nextState);
                }    
            })
        ];

        var closeButton = React.DOM.div({
            id: "close-button",
            onClick: function(){
                document.getElementById('panel').classList.toggle('open');
            }
        });
        
        return React.DOM.div({
                id: 'panel',
                className: classes
            },
            [
                React.DOM.h1({}, 'Controls'),
                closeButton,
                controls
            ]
        );
    }
});

module.exports = Panel;
