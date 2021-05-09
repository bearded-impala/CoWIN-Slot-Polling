import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Card, Container, Form, Grid, Header, Icon, List, Segment } from 'semantic-ui-react';
import Table from './components/Table';
import { formatDate } from './utils/util';
let sessionTimer;

function CowinNotification() {
  var date = new Date();
  date.setDate(date.getDate() + 1);
  var day = ("0" + date.getDate()).slice(-2);
  var month = ("0" + (date.getMonth() + 1)).slice(-2);
  var year = date.getFullYear();
  const [availability, setAvailability] = useState([]);
  const [history, setHistory] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState(21);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(363);
  const [selectedDate, setSelectedDate] = useState(`${year}-${month}-${day}`);
  const [loading, setLoading] = useState(false);
  const [pinfilter, setPinfilter] = useState('');
  const [minAge, setMinAge] = useState(18);
  const [vaccine, setVaccine] = useState('ANY');
  const [feeType, setFeeType] = useState('ANY');
  const [pollingInterval, setPollingInterval] = useState(10000);

  useEffect(() => {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
    } else {
      Notification.requestPermission();
    }
    getStates();
  }, [])

  useEffect(() => {
    if (selectedState) {
      getDistricts();
    }
  }, [selectedState])

  useEffect(() => {
    if (availability.length > 0) {
      showNotification('Slot Available');
      persistHistory();
    }
  }, [availability])

  const persistHistory = () => {
    const flag = {};
    const unique = [];
    const duplicates = [...history, ...availability];
    duplicates.forEach(elem => {
      if (!flag[elem.center_id]) {
        flag[elem.center_id] = true;
        unique.push(elem);
      }
    })
    setHistory(unique);
  };

  const clearHistory = () => {
    setAvailability([]);
    setHistory([]);
  }

  const startPolling = () => {
    setAvailability([]);
    isSessionAvailable();
    setLoading(true);
  }

  const stopPolling = () => {
    setLoading(false);
    clearInterval(sessionTimer);
    sessionTimer = null;
  }

  const resetTimer = () => {
    clearInterval(sessionTimer);
    sessionTimer = setInterval(isSessionAvailable, pollingInterval);
  };

  const getStates = () => {
    axios.get('https://cdn-api.co-vin.in/api/v2/admin/location/states')
      .then((response) => {
        const stateList = response.data.states.map(arrayItem => ({
          key: arrayItem.state_name,
          value: arrayItem.state_id,
          text: arrayItem.state_name
        }));
        setStates(stateList);
      })
  }

  const getDistricts = () => {
    axios.get(`https://cdn-api.co-vin.in/api/v2/admin/location/districts/${selectedState}`)
      .then((response) => {
        const districtList = response.data.districts.map(arrayItem => ({
          key: arrayItem.district_name,
          value: arrayItem.district_id,
          text: arrayItem.district_name
        }));
        setDistricts(districtList);
      })
  }

  const handlePollingIntervalChange = (e, { name, value }) => {
    setPollingInterval(value)
  };

  const handleStateChange = (e, { name, value }) => {
    setSelectedState(value)
  };

  const handleDistrictChange = (e, { name, value }) => {
    setSelectedDistrict(value)
  };

  const handleDateChange = (e, { name, value }) => {
    setSelectedDate(value)
  };

  const handleMinAgeChange = (e, { name, value }) => {
    setMinAge(value)
  };

  const handleVaccineChange = (e, { name, value }) => {
    setVaccine(value);
  }

  const handleFeeTypeChange = (e, { name, value }) => {
    setFeeType(value);
  }

  const handlePinfilterChange = (e, { name, value }) => {
    setPinfilter(value);
  }

  const checkVaccine = (availableVaccine) => {
    if (availableVaccine === vaccine) {
      return true;
    }
    if (vaccine === 'ANY') {
      return true;
    }
    return false;
  }

  const checkFeeType = (fee) => {
    if (fee === feeType) {
      return true;
    }
    if (feeType === 'ANY') {
      return true;
    }
    return false;
  }

  var data = [];
  const isSessionAvailable = () => {
    data = [];
      axios.get(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id=${selectedDistrict}&date=${formatDate(selectedDate)}`)
      .then((response) => {
        data = [];
        response.data.sessions.forEach(function (arrayItem) {
          if (arrayItem.min_age_limit === minAge && checkVaccine(arrayItem.vaccine) && checkFeeType(arrayItem.fee_type) && arrayItem.pincode.toString().startsWith(pinfilter)) {
            data.push({
              "center_id": arrayItem.center_id,
              "pincode": arrayItem.pincode,
              "address": arrayItem.address,
              "district_id": arrayItem.district_id,
              "fee_type": arrayItem.fee_type,
              "available_capacity": arrayItem.available_capacity,
              "vaccine": arrayItem.vaccine,
              "time": new Date().toISOString()
            })
          }
      });
      }).finally(() => {
        setAvailability(data)
      }).catch((e) => {
        clearInterval(sessionTimer);
      })
    resetTimer();
  }

  const showNotification = (message) => {
      Notification.requestPermission(function(result) {
        if (result === 'granted') {
          navigator.serviceWorker.ready.then(function(registration) {
            registration.showNotification(message, {
              body: 'Hurry Up',
              vibrate: [1000, 100, 200, 100, 200, 100, 1000],
              tag: 'CoWIN slot polling',
              renotify: true
            });
          });
        }
      });
  }
  
  const columns = [
    { Header: 'CENTER', accessor: 'center_id' },
    { Header: 'PIN', accessor: 'pincode' },
    { Header: 'ADDRESS', accessor: 'address', width: 300 },
    { Header: 'DISTRICT', accessor: 'district_id' },
    { Header: 'AVAILABLE', accessor: 'available_capacity' },
    { Header: 'VACCINE', accessor: 'vaccine' },
    { Header: 'FEE', accessor: 'fee_type' },
    { Header: 'TIME', accessor: 'time' },
  ];

  return (
    <>
      <Header
        attached
        block
        as="h1"
        content="Co-WIN Slot Polling"
        size="huge"
        subheader="Poll CoWIN for available appointment slots to get an alert as soon as a slot is available that meets your criteria"
      />
      <Card fluid>
      <Card.Content>
      <Form>
        <Form.Group widths="equal">
         <Form.Input
            type="date"
            label="Date"
            name="date"
            id="date"
            value={selectedDate}
            placeholder="Select Date"
            onChange={handleDateChange}
            required
          />
        <Form.Select
            label="State"
            name="selectedState"
            id="selectedState"
            options={states}
            value={selectedState}
            placeholder="Select State"
            onChange={handleStateChange}
            search
          />
          <Form.Select
            label="District"
            name="selectedDistrict"
            id="selectedDistrict"
            options={districts}
            value={selectedDistrict}
                placeholder="Select District"
            onChange={handleDistrictChange}
            search
            />
          <Form.Input
              name="pinfilter"
              label="Match Pincode"
              id="pinfilter"
              onChange={handlePinfilterChange}
              value={pinfilter}
              placeholder="411"
            />
          </Form.Group>
          <Form.Group widths="equal">
            <Form.Select
              name="minAge"
              label="Age"
              id="minAge"
              options={[{ key: 18, value: 18, text: '18-44' },
                    { key: 45, value: 45, text: '45+' }]}
              onChange={handleMinAgeChange}
              value={minAge}
            />
          <Form.Select
              name="vaccine"
              label="Vaccine"
              id="vaccine"
                options={[{ key: "ANY", value: "ANY", text: "ANY" },
                  { key: "COVISHIELD", value: "COVISHIELD", text: "COVISHIELD" },
                    { key: "COVAXIN", value: "COVAXIN", text: "COVAXIN" }]}
              onChange={handleVaccineChange}
              value={vaccine}
              />
              <Form.Select
              name="feeType"
              label="Fees"
              id="feeType"
                options={[{ key: "ANY", value: "ANY", text: "ANY" },
                  { key: "FREE", value: "Free", text: "FREE" },
                    { key: "PAID", value: "Paid", text: "PAID" }]}
              onChange={handleFeeTypeChange}
              value={feeType}
              />
            <Form.Select
              name="pollingInterval"
              label="Polling Interval (sec)"
              id="pollingInterval"
                options={[{ key: 5, value: 5000, text: 5 },
                  { key: 10, value: 10000, text: 10 },
                    { key: 20, value: 20000, text: 20 }]}
              onChange={handlePollingIntervalChange}
              value={pollingInterval}
              />
           </Form.Group>
        </Form>
        </Card.Content>
            <Card.Content extra>
        <div className="ui three buttons">
          <Button
            content="Start"
            onClick={startPolling}
            loading={loading}
            disabled={sessionTimer}
            color="green"
            fluid
          />
          <Button
            content="Stop"
            onClick={stopPolling}
            disabled={!sessionTimer}
            color="gray"
            fluid
            />
            <Button
            content="Clear"
            onClick={clearHistory}
            disabled={history.length < 1 && availability.length < 1}
            color="red"
          />
                </div>
        </Card.Content>
      </Card>
      <Header
        attached
        block
        as="h2"
        content="Available Slots"
        size="huge"
      />
          <Table
            columns={columns}
            data={availability}
            sorted={[{
              id: 'available_capacity',
              desc: true
            }]}
        filterable />
      <Header
        attached
        block
        as="h2"
        content="History"
        size="huge"
      />
        <Table
            columns={columns}
            data={history}
            sorted={[{
              id: 'time',
              desc: true
            }]}
            filterable />
      <Segment vertical style={{ padding: '3em 0em' }}>
        <Container>
          <Grid divided stackable>
            <Grid.Row>
              <Grid.Column width={3}>
                <Header as="h4" content="Siddhesh More" />
              </Grid.Column>
              <Grid.Column width={8}/>
              <Grid.Column width={4}>
                <List>
                  <List.Item>beardedimpala@gmail.com</List.Item>
                </List>
              </Grid.Column>
              <Grid.Column width={1}>
              <List link>
                <List.Item target="_blank" as="a" href="https://www.linkedin.com/in/sid-more/"><Icon name="linkedin"/></List.Item>
              </List>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Container>
      </Segment>
</>
  );
}

export default CowinNotification;