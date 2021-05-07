import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Card, Form, Header } from 'semantic-ui-react';
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
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState(21);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(363);
  const [selectedDate, setSelectedDate] = useState(`${year}-${month}-${day}`);
  const [loading, setLoading] = useState(false);
  const [pinfilter, setPinfilter] = useState('411');
  const [minAge, setMinAge] = useState(18);
  const [vaccine, setVaccine] = useState('ANY');
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
    }
  }, [availability])

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

  var data = [];
  const isSessionAvailable = () => {
    data = [];
      axios.get(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id=${selectedDistrict}&date=${formatDate(selectedDate)}`)
      .then((response) => {
        data = [];
        response.data.sessions.forEach(function (arrayItem) {
          if (arrayItem.min_age_limit === minAge && checkVaccine(arrayItem.vaccine) && arrayItem.pincode.toString().startsWith(pinfilter)) {
            data.push({
              "pincode": arrayItem.pincode,
              "address": arrayItem.address,
              "fee_type": arrayItem.fee_type,
              "available_capacity": arrayItem.available_capacity,
              "vaccine": arrayItem.vaccine
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
    { Header: 'PIN', accessor: 'pincode' },
    { Header: 'ADDRESS', accessor: 'address', width: 400 },
    { Header: 'AVAILABLE', accessor: 'available_capacity' },
    { Header: 'VACCINE', accessor: 'vaccine' },
    { Header: 'FEE', accessor: 'fee_type' },
  ];

  return (
<>
  <Header block attached="top" size="huge">Co-WIN Slot Polling</Header>
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
              label="Pin Code Match"
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
        <div className="ui two buttons">
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
            color="red"
            fluid
          />
                </div>
            </Card.Content>
            </Card>
          <Table columns={columns} data={availability} />
</>
  );
}

export default CowinNotification;