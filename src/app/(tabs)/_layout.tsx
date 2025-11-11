import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabsLayout() {
  return (
    <NativeTabs minimizeBehavior="automatic">
      <NativeTabs.Trigger name="home">
        <Icon sf="house" />
        <Label hidden />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf="person.crop.circle" />
        <Label hidden />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
