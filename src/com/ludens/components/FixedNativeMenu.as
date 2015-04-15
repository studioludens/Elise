package com.ludens.components
{
	import flash.display.NativeMenu;
	
	import mx.collections.ICollectionView;
	import mx.collections.errors.ItemPendingError;
	import mx.controls.FlexNativeMenu;

	public class FixedNativeMenu extends FlexNativeMenu
	{
		public function FixedNativeMenu()
		{
			super();
			
			
		}
		
		private function populateMenu(menu:NativeMenu, collection:ICollectionView):NativeMenu
	    {
	        var collectionLength:int = collection.length;
	        for (var i:int = 0; i < collectionLength; i++)
	        {
	            try
	            {
	                parent.insertMenuItem(menu, i+1, collection[i]);
	            }
	            catch(e:ItemPendingError)
	            {
	                //we probably dont need to actively recover from here
	            }
	        }
	
	        return menu;
	    }
	}
}