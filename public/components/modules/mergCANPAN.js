Vue.component('merg-canpan', {
    name: "merg-canpan",
    //mixins: [nodeMixin],
    data: function () {
        return {
            nodeId: 0
        }
    },
    mounted() {
        this.nodeId = this.$store.state.selected_node_id
        this.getInfo()
    },
    computed: {
        node: function () {
            return this.$store.state.nodes[this.$store.state.selected_node_id]
        }
    },
    methods: {
        getInfo() {
            this.$store.state.node_component = "nodeInfo"
        },
        getVariables() {
            this.$store.state.node_component = "merg-canpan-node-variables"
        },
        getEvents() {
            console.log(`merg-canpan - NERD : ${this.nodeId}`)
            //this.$root.send('NERD', {'nodeId': this.nodeId})
            this.$store.state.node_component = "merg-canpan-node-events"
        }
    },
    template: `
      <v-container>
      <h1>merg-canpan</h1>
      <v-tabs>
        <v-tab :key="1" @click="getInfo()">Info</v-tab>
        <v-tab :key="2" @click="getVariables()">Variables</v-tab>
        <v-tab :key="3" @click="getEvents()">Events</v-tab>
        <v-tab-item :key="1">
          <!--<nodeInfo :nodeId="node.node"></nodeInfo>-->
        </v-tab-item>
        <v-tab-item :key="2">
          <!--<merg-canpan-node-variables :nodeId="node.node"></merg-canpan-node-variables>-->
        </v-tab-item>
        <v-tab-item :key="3">
          <!--<merg-canpan-node-events :nodeId="node.node"></merg-canpan-node-events>-->
        </v-tab-item>
      </v-tabs>
      <v-container v-if="$store.state.debug">
        <p>{{ $store.state.node_component }}</p>
      </v-container>
      <component v-bind:is="$store.state.node_component"></component>
      <v-container v-if="$store.state.debug">
        <p>{{ JSON.stringify(node) }}</p>
      </v-container>
      </v-container>
    `
})

Vue.component('merg-canpan-node-variables', {
    name: "merg-canpan-node-variables",
    //props: ['nodeId'],
    mounted() {
        this.$root.send('REQUEST_ALL_NODE_VARIABLES', {
            "nodeId": this.nodeId,
            "variables": this.node.parameters[6],
            "delay": 20
        })
        /*for (let i = 1; i <= this.node.parameters[6]; i++) {
            this.$root.send('NVRD', {"nodeId": this.nodeId, "variableId": i})
        }*/
    },
    computed: {
        nodeId: function () {
            return this.$store.state.selected_node_id
        },
        node: function () {
            return this.$store.state.nodes[this.$store.state.selected_node_id]
        },
    },
    methods: {
        updateNV: function (node_id, variableId, variableValue) {
            console.log(`update CANPAN NV(${variableId},${variableValue})`)
            this.$root.send('UPDATE_NODE_VARIABLE', {
                "nodeId": node_id,
                "variableId": variableId,
                "variableValue": variableValue
            })
        }
    },
    template: `
      <v-container>
      <node-variable-select v-bind:nodeId="nodeId" :varId="1"
                            name="On startup"
                            :items="[{value:0, text:'Send Current Events'},{value:1, text:'Do Nothing'},{value:2, text:'Send All Events'}]">
      </node-variable-select>
      <v-container v-if="$store.state.debug">
        <p>{{ node.variables }}</p>
      </v-container>
      </v-container>`
})

Vue.component('merg-canpan-node-events', {
    name: "merg-canpan-node-events",
    //props: ['nodeId'],
    data: function () {
        return {
            eventDialog: false,
            editedEvent: {event: "0", variables: [], actionId: 1},
            headers: [
                {text: 'Event Name', value: 'event'},
                {text: 'Action ID', value: 'actionId'},
                {text: 'Actions', value: 'actions', sortable: false}
            ]
        }
    },
    methods: {
        editEvent: function (item) {
            console.log(`editEvent(${item.event})`)
            for (let i = 1; i <= this.node.parameters[5]; i++) {
                this.$root.send('REVAL', {"nodeId": this.nodeId, "actionId": item.actionId, "valueId": i})
            }
            //this.eventDialog = true
            this.editedEvent = item
            this.$store.state.selected_action_id = item.actionId
            this.$store.state.node_component = "merg-canpan-node-event-variables"

        },
        deleteEvent: function (event) {
            console.log(`deleteEvent : ${this.node.node} : ${event}`)
            this.$root.send('REMOVE_EVENT', {"nodeId": this.node.node, "eventName": event.event})
        }
    },
    mounted() {
        if (this.node.EvCount > 0) {
            console.log(`REQUEST_CLEAR_ALL_NODE_EVENTS : ${this.nodeId}`)
            this.$root.send('CLEAR_NODE_EVENTS', {'nodeId': this.nodeId})
            console.log(`REQUEST_ALL_NODE_EVENTS : ${this.nodeId}`)
            this.$root.send('REQUEST_ALL_NODE_EVENTS', {"nodeId": this.nodeId})
        }
    },
    computed: {
        nodeId: function () {
            return this.$store.state.selected_node_id
        },
        node: function () {
            return this.$store.state.nodes[this.nodeId]
        },
        eventList: function () {
            return Object.values(this.$store.state.nodes[this.nodeId].actions)
        }
    },
    template: `
      <v-container>
      <h3>Event Variables</h3>
      <v-card>
        <v-data-table :headers="headers"
                      :items="eventList"
                      :items-per-page="20"
                      class="elevation-1"
                      item-key="id">
          <template v-slot:top>
            <v-toolbar flat>
              <v-toolbar-title>Events for {{ node.node }}</v-toolbar-title>
              <v-divider
                  class="mx-4"
                  inset
                  vertical
              ></v-divider>
              <v-spacer></v-spacer>
              <v-dialog v-model="eventDialog" max-width="500px">
                <v-card>
                  <v-card-title>
                    <span class="headline">Edit Event</span>
                  </v-card-title>
                  <v-card-text>
                    <v-container>
                      <v-row>
                        <merg-canpan-node-event-variables
                            v-bind:nodeId="nodeId"
                            v-bind:actionId="editedEvent.actionId">
                        </merg-canpan-node-event-variables>
                      </v-row>
                    </v-container>
                  </v-card-text>
                </v-card>
              </v-dialog>
            </v-toolbar>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn color="blue darken-1" text @click="editEvent(item)" outlined>Edit</v-btn>
            <v-btn color="blue darken-1" text @click="deleteEvent(item)" outlined>Delete</v-btn>
          </template>
        </v-data-table>
      </v-card>
      <v-container v-if="$store.state.debug">
        <p>{{ $store.state.nodes[this.nodeId].actions }}</p>
      </v-container>
      </v-container>`
})

Vue.component('merg-canpan-node-event-variables', {
    name: "merg-canpan-node-event-variables",
    //props: ['nodeId', 'actionId'],
    mounted() {
        console.log(`merg-CANPAN-node-event-variables mounted : ${this.nodeId} :: ${this.actionId}`)
        this.$root.send('REQUEST_ALL_EVENT_VARIABLES', {
            "nodeId": this.nodeId,
            "eventIndex": this.actionId,
            "variables": this.node.parameters[5],
            "delay": 140
        })
        /*        for (let i = 1; i <= this.node.parameters[5]; i++) {
                    this.$root.send('REVAL', {"nodeId": this.nodeId, "actionId": this.actionId, "valueId": i})
                }*/
    },
    computed: {
        node: function () {
            return this.$store.state.nodes[this.$store.state.selected_node_id]
        },
        nodeId: function () {
            return this.$store.state.selected_node_id
        },
        actionId: function () {
            return this.$store.state.selected_action_id
        }
    },
    methods: {
        updateEV: function (nodeId, eventName, actionId, eventId, eventVal) {
            // eslint-disable-next-line no-console
            console.log(`Update Event(${nodeId},${eventName},${actionId},${eventId},${eventVal})`)
            this.$root.send('UPDATE_EVENT_VARIABLE', {
                "nodeId": this.node.node,
                "eventIndex": actionId,
                "eventName": eventName,
                "eventVariableId": eventId,
                "eventVariableValue": eventVal
            })
        }
    },
    template: `
      <v-container>
      <h3>Event Variables</h3>
      <v-container v-if="$store.state.debug">
        <p>{{ node.actions[actionId] }}</p>
      </v-container>
      <v-card outlined>
        <v-card-title>Startup Options</v-card-title>
        <v-card-text>
          <v-radio-group v-model="node.actions[actionId].variables[3]" :mandatory="true"
                         @change="updateEV(node.node,
                                   node.actions[actionId].event,
                                   node.actions[actionId].actionId,
                                   3,
                                   parseInt(node.actions[actionId].variables[3]))">
            <v-radio label="On/Off" :value="1"></v-radio>
            <v-radio label="Off/On" :value="3"></v-radio>
            <v-radio label="On Only" :value="4"></v-radio>
            <v-radio label="Off Only" :value="6"></v-radio>
            <v-radio label="On/Off Toggle" :value="8"></v-radio>
          </v-radio-group>
        </v-card-text>
      </v-card>
      <v-card outlined>
        <v-card-title>Active</v-card-title>
        <node-event-variable-bit-array2 v-bind:nodeId="$store.state.selected_node_id"
                                        v-bind:action="$store.state.selected_action_id"
                                        varId="5"
                                        name="Active Outputs" offset="0">
        </node-event-variable-bit-array2>
        <node-event-variable-bit-array2 v-bind:nodeId="$store.state.selected_node_id"
                                        v-bind:action="$store.state.selected_action_id"
                                        varId="6"
                                        name="Active Outputs" offset="8">
        </node-event-variable-bit-array2>
        <node-event-variable-bit-array2 v-bind:nodeId="$store.state.selected_node_id"
                                        v-bind:action="$store.state.selected_action_id"
                                        varId="7"
                                        name="Active Outputs" offset="16">
        </node-event-variable-bit-array2>
        <node-event-variable-bit-array2 v-bind:nodeId="$store.state.selected_node_id"
                                        v-bind:action="$store.state.selected_action_id"
                                        varId="8"
                                        name="Active Outputs" offset="24">
        </node-event-variable-bit-array2>
      </v-card>
      <v-card outlined>
        <v-card-title>Polarity</v-card-title>
        <node-event-variable-bit-array2 v-bind:nodeId="$store.state.selected_node_id"
                                        v-bind:action="$store.state.selected_action_id"
                                        varId="9"
                                        name="Active Outputs" offset="0">
        </node-event-variable-bit-array2>
        <node-event-variable-bit-array2 v-bind:nodeId="$store.state.selected_node_id"
                                        v-bind:action="$store.state.selected_action_id"
                                        varId="10"
                                        name="Active Outputs" offset="8">
        </node-event-variable-bit-array2>
        <node-event-variable-bit-array2 v-bind:nodeId="$store.state.selected_node_id"
                                        v-bind:action="$store.state.selected_action_id"
                                        varId="11"
                                        name="Active Outputs" offset="16">
        </node-event-variable-bit-array2>
        <node-event-variable-bit-array2 v-bind:nodeId="$store.state.selected_node_id"
                                        v-bind:action="$store.state.selected_action_id"
                                        varId="12"
                                        name="Active Outputs" offset="24">
        </node-event-variable-bit-array2>
      </v-card>
      <v-card outlined>
        <v-card-title>Actions for all LEDs (13)</v-card-title>
        <v-card-text>
          <v-radio-group
              v-model="node.actions[actionId].variables[13]"
              :mandatory="true"
              @change="updateEV(node.node,
                            node.actions[actionId].event,
                            node.actions[actionId].actionId,
                            13,
                            parseInt(node.actions[actionId].variables[13]))"
          >
            <v-radio label="On/Off" :value="255"></v-radio>
            <v-radio label="On Only" :value="254"></v-radio>
            <v-radio label="Off Only" :value="253"></v-radio>
            <v-radio label="Flash" :value="248"></v-radio>
          </v-radio-group>
        </v-card-text>
      </v-card>
      <v-row>
        <node-event-variable v-bind:nodeId="nodeId"
                             v-bind:actionId="actionId"
                             v-bind:varId="n"
                             v-for="n in node.parameters[5]"
                             :key="n">

        </node-event-variable>
      </v-row>
      <v-container v-if="$store.state.debug">
        <p>{{ node.actions[actionId] }}</p>
      </v-container>
      </v-container>`
})