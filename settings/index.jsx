function mySettings(props) {
  return (
    <Page>
      <Section title="Login" description="Please enter your Baby Connect credentials"/>
      <TextInput label="Email" settingsKey="email"/>
      <TextInput label="Password" settingsKey="password"/>
    </Page>
  );
}

registerSettingsPage(mySettings);