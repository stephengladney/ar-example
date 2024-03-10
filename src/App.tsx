import { useEffect, useState } from "react"
import "./App.css"
import arule from "automation-rules"
import type { Operator } from "automation-rules"
import { params, triggers } from "./arules"

type Person = {
  name: string
  age: number
  hometown: string
}

// Generate callback functions
const getAlertCallback = (msg: string) => () => alert(msg)
const getBackgroundColorCallback = (color: string) => () => {
  document.getElementsByTagName("body")[0].style.backgroundColor = color
}

type Action = "Show an alert" | "Change background"

// Enable logging for successes and failures
arule.log.setLogging({ onSuccess: true, onFailure: true })

// Get values from code
const personParamKeys = arule.params.keys.getAllBySchema(params, "person")
const personTriggerEvents = arule.triggers.events.getAllBySchema(
  triggers,
  "person"
)

// Create types for React
type PersonTriggerEvent = (typeof personTriggerEvents)[number]
type PersonParamKey = (typeof personParamKeys)[number]

function App() {
  const [people, setPeople] = useState<Person[]>([])
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [newRuleTrigger, setNewRuleTrigger] = useState<PersonTriggerEvent>(
    personTriggerEvents[0]
  )
  const [newRuleParam, setNewRuleParam] = useState<PersonParamKey>(
    personParamKeys[0]
  )
  const [newRuleParamValue, setNewRuleParamValue] = useState<string | number>(
    ""
  )
  const [newRuleAction, setNewRuleAction] = useState<Action>("Show an alert")
  const [newRuleOperator, setNewRuleOperator] = useState<Operator>("equals")
  const [newRuleActionValue, setNewRuleActionValue] = useState("")
  const [newRuleName, setNewRuleName] = useState("")
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    // Define how to log successes and failures of rules (optional)

    // Note: The callback gives you access to 4 things:
    // 1. The rule,
    // 2. Whether or not the rule was successful
    // 3. The data evaluated
    // 4. If the rule was not successful, the first condition that failed.

    arule.log.setLogCallback((rule, isSuccess, person) => {
      setLogs((logs) => [
        ...logs,
        `${isSuccess ? "SUCCESS: " : "FAIL: "} ${rule.description} (${
          person.name
        }, ${person.age}, ${person.hometown})`,
      ])
    })
  }, [])

  const addNewPerson = () => {
    const name = String(prompt("Enter person's name"))
    const age = Number(prompt("Enter person's age"))
    const hometown = String(prompt("Enter person's hometown"))
    setPeople((people) => [...people, { name, age, hometown }])

    // Execute all created rules with the create person trigger
    const personCreatedTrigger = arule.triggers.getBySchemaAndEvent(
      triggers,
      "person",
      "When a person is created"
    )
    // console.log(arule.rules.getAllByTrigger(personCreatedTrigger))
    console.log(arule.rules.getAll())

    arule.rules.executeAllByTrigger(personCreatedTrigger, {
      name,
      age,
      hometown,
    })
  }

  const removePerson = (i: number) => {
    // Execute all created rules with the delete person trigger
    const personRemovedTrigger = arule.triggers.getBySchemaAndEvent(
      triggers,
      "person",
      "When a person is deleted"
    )
    arule.rules.executeAllByTrigger(personRemovedTrigger, people[i])

    // Remove the person
    setPeople((people) => [...people.slice(0, i), ...people.slice(i + 1)])
  }

  const clearRuleParams = () => {
    setNewRuleTrigger("When a person is created")
    setNewRuleParam("name")
    setNewRuleOperator("equals")
    setNewRuleAction("Show an alert")
    setNewRuleActionValue("")
    setNewRuleName("")
  }

  const createNewRule = () => {
    // Use the parameter, operator and value provided by the user
    const selectedParam = arule.params.getBySchemaAndKey(
      params,
      "person",
      newRuleParam
    )
    const condition = arule.conditions.create(
      selectedParam,
      newRuleOperator,
      newRuleParamValue
    )

    const callback =
      newRuleAction === "Show an alert"
        ? getAlertCallback(newRuleActionValue)
        : getBackgroundColorCallback(newRuleActionValue)

    const callbackDescription =
      newRuleAction === "Show an alert"
        ? `Show alert "${newRuleActionValue}"`
        : `Set background to "${newRuleActionValue}"`

    // Create a new rule with paramters provided by the user
    const selectedTrigger = arule.triggers.getBySchemaAndEvent(
      triggers,
      "person",
      newRuleTrigger
    )
    arule.rules.create(
      selectedTrigger,
      [condition],
      callback,
      callbackDescription,
      newRuleName
    )

    console.log(arule.rules.getAll())
    console.log(selectedTrigger)
    console.log(arule.rules.getAllByTrigger(selectedTrigger))

    // Clear form inputs and hide form
    clearRuleParams()
    setShowRuleForm(false)
  }

  return (
    <>
      <div className="grid grid-cols-2 w-full gap-2 min-h-[500px]">
        <div className="border-2 border-black border-solid p-4">
          <h1>Create an automation rule</h1>
          <button
            className="bg-blue-500 text-white font-bold w-[150px]"
            onClick={() => setShowRuleForm(true)}
          >
            New Rule
          </button>
          {showRuleForm && (
            <div className="text-left mt-8 border-[1px] border-solid border-slate-500 p-3 flex flex-col gap-4">
              <div className="grid grid-cols-2">
                <div>
                  <span>Select trigger</span>
                </div>
                <select
                  className="border-[1px] border-solid border-black p-2"
                  onChange={(e) =>
                    setNewRuleTrigger(JSON.parse(e.target.value))
                  }
                >
                  {arule.triggers
                    .getAllBySchema(triggers, "person")
                    .map((trigger) => (
                      <option value={JSON.stringify(trigger)}>
                        {trigger.event}
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2">
                <div>
                  <span className="mr-2">Select parameter</span>
                </div>
                <select
                  className="border-[1px] border-solid border-black p-2"
                  onChange={(e) => setNewRuleParam(JSON.parse(e.target.value))}
                >
                  {arule.params
                    .getAllBySchema(params, "person")
                    .map((param) => (
                      <option value={JSON.stringify(param)}>{param.key}</option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2">
                <div>
                  <span className="mr-2">Select operator</span>
                </div>
                <select
                  className="border-[1px] border-solid border-black p-2"
                  onChange={(e) =>
                    setNewRuleOperator(e.target.value as Operator)
                  }
                >
                  {arule.operators.map((op) => (
                    <option>{op}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2">
                <div>
                  <span className="mr-2">Desired value</span>
                </div>
                <input
                  className="border-[1px] border-solid border-black p-2"
                  onChange={(e) => {
                    {
                      setNewRuleParamValue(
                        newRuleParam === "age"
                          ? Number(e.target.value)
                          : e.target.value
                      )
                    }
                  }}
                />
              </div>
              <div className="grid grid-cols-2">
                <div>
                  <span className="mr-2">Select action</span>
                </div>
                <select
                  className="border-[1px] border-solid border-black p-2"
                  onChange={(e) => {
                    setNewRuleAction(e.target.value as Action)
                  }}
                >
                  {["Show an alert", "Change background"].map((param) => (
                    <option>{param}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2">
                <div>
                  <span className="mr-2">
                    {newRuleAction === "Show an alert"
                      ? "Alert text"
                      : "Background color"}
                  </span>
                </div>
                <input
                  className="border-[1px] border-solid border-black p-2"
                  onChange={(e) => {
                    setNewRuleActionValue(e.target.value)
                  }}
                />
              </div>
              <div className="grid grid-cols-2">
                <div>
                  <span className="mr-2">Rule name</span>
                </div>
                <input
                  className="border-[1px] border-solid border-black p-2"
                  onChange={(e) => {
                    setNewRuleName(e.target.value)
                  }}
                />
              </div>
              <div className="text-right">
                <button
                  className="text-white bg-blue-900 w-[150px]"
                  onClick={createNewRule}
                >
                  Create
                </button>
              </div>
            </div>
          )}
          <div className="text-left mt-8">
            <h3 className="font-bold mb-3">Rules</h3>
            {/* Use getRules() to return an array of the active rules */}
            {arule.rules.getAll().map((rule) => (
              <div className="p-2 border-solid border-[1px] border-slate-400 mb-2">
                <div>
                  <span className="font-bold text-sm text-slate-600">
                    {rule.description}
                  </span>
                </div>
                <div>
                  <span className="text-sm">
                    <span className="font-bold">{rule.trigger.event}</span> and{" "}
                    <span className="font-bold text-blue-600">
                      {rule.conditions[0].param.key}{" "}
                    </span>
                    {rule.conditions[0].operator}{" "}
                    <span className="font-bold text-orange-600">
                      {rule.conditions[0].value}
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-sm ml-2">
                    {"=>"} {rule.callbackDescription}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-2 border-black border-solid p-4">
          <h1>Create a new Person record</h1>
          <button
            className="bg-green-500 text-white font-bold w-[150px]"
            onClick={addNewPerson}
          >
            New Person
          </button>
          <div className="text-left mt-8">
            <h3 className="font-bold">People</h3>
            {people.map((person, i) => (
              <div className="py-1">
                <span
                  className="bg-red-600 text-white font-extrabold mr-1 rounded-full px-1 mt-1 cursor-pointer hover:bg-red-700"
                  onClick={() => removePerson(i)}
                >
                  X
                </span>
                <span>
                  {person.name} ({person.age}) from {person.hometown}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="border-2 border-black border-solid p-2 mt-4">
        <h3 className="text-left font-bold">Logs</h3>
        <div className="text-left">
          {logs.map((log) => (
            <span className="block">{log}</span>
          ))}
        </div>
      </div>
    </>
  )
}

export default App
