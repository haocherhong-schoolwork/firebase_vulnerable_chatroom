// Initialize Firebase
var config = {
	apiKey: "AIzaSyBqMx-XOzwUt3H9f6mfwrIRBf1OETlDHHw",
	authDomain: "f2e-hw11.firebaseapp.com",
	databaseURL: "https://f2e-hw11.firebaseio.com",
	projectId: "f2e-hw11",
	storageBucket: "f2e-hw11.appspot.com",
	messagingSenderId: "22230224255"
};
firebase.initializeApp(config);

var messengerDBRef,
	storageRef,
	user,
	profile;

var setTab = function(selectedTab) {
	var $navs = $('nav li');
	var tabs = $navs.toArray().map(function(element) {
		return element.getAttribute('data-target');
	});
	$navs.each(function(index) {
		var nav = $navs[index],
			tab = nav.getAttribute('data-target'),
			toggle = tab === selectedTab;

		$(nav).toggleClass('active', toggle);
		$('#' + tab).toggle(toggle);
	})
}

var successHandler = function() {
	$('#message-error').slideUp();
	$('#message-success').text('Success').slideDown();
}

var errorHandler = function(error) {
	console.error({
		code: error.code,
		message: error.message
	});

	$('#message-success').slideUp();
	$('#message-error').text(errorMessage).slideDown();
};

var updateProfileFromServer = function() {
	firebase.database().ref('/users/' + firebase.auth().currentUser.uid).once('value').then(function(snapshot) {
		onGetProfile(snapshot.val());
	});
}

var onGetUser = function(newUser) {
	user = user;

	$('#restricted-contents').slideDown();
	$('#modal-login').modal('hide');
	$('#btn-signout').show();
	updateProfileFromServer();

	storageRef = firebase.storage().ref();

	//Start listening to messenger db
	$('#messenger-list').empty();
	messengerDBRef = firebase.database().ref('/messenger/');
	messengerDBRef.limitToLast(10).on('child_added', function(snapshot) {
		var message = snapshot.val();
		var $li = $('<li class="list-group-item">'),
			$name = $('<strong>').text(message.name);

		if(message.photoURL)
			$li.append($('<img height="40">').attr('src', message.photoURL)).append(' ');

		$li.append($name).append(' ').append($('<span>').text(message.message));

		$('#messenger-list').append($li);

		// Scroll to botttom
		$("html, body").animate({ scrollTop: $(document).height()-$(window).height() });
	});
}

var onGetProfile = function(newProfile) {
	profile = newProfile;

	$('#update-username').val(profile && profile.username);
	$('#update-occupation').val(profile && profile.occupation);
	$('#update-age').val(profile && profile.age);
	$('#update-description').val(profile && profile.description);
	$('#profile-username').text(profile && profile.username);
	$('#profile-occupation').text(profile && profile.occupation);
	$('#profile-age').text(profile && profile.age);
	$('#profile-description').text(profile && profile.description);

	if (profile) {
		setTab('div-user-info');

		if(profile.photoURL)
			$('#img-profile-pic, #img-update-profile-pic').attr('src', profile.photoURL).show();
		else
			$('#img-profile-pic, #img-update-profile-pic').hide();
		
	} else {
		setTab('form-update')
	}

}

firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		onGetUser(user);
	} else {
		$('#restricted-contents').slideUp();

		$('#modal-login').modal({
			backdrop: 'static',
			keyboard: false
		});
		$('#btn-signout').hide();
	}
});

$('#btn-signup').click(function(e) {
	e.preventDefault();
	var email = $('#login-email').val(),
		password = $('#login-password').val();

	firebase.auth().createUserWithEmailAndPassword(email, password).then(successHandler).catch(errorHandler);
})

$('#btn-signin').click(function(e) {
	e.preventDefault();

	var email = $('#login-email').val(),
		password = $('#login-password').val();

	firebase.auth().signInWithEmailAndPassword(email, password).then(successHandler).catch(errorHandler);
});

$('#btn-signout').click(function(e) {
	e.preventDefault();
	firebase.auth().signOut().then(successHandler).catch(errorHandler);
});

$('#form-update').submit(function(e) {
	e.preventDefault();
	var data = $(this).serializeArray().reduce((function(acc, entry) {
		acc[entry.name] = entry.value;
		return acc;
	}), {});

	if(data.photoURL)
		data.photoURL = profile.photoURL;

	var userId = firebase.auth().currentUser.uid,
		file = $('#update-photo').get(0).files[0];

	if (file) {

		var imageRef = storageRef.child('images/' + userId + '/profile.jpg');

		imageRef.put(file).then(function(snapshot) {
			data.photoURL = snapshot.metadata.downloadURLs[0];
			firebase.database().ref('users/' + userId).set(data).then(successHandler).then(updateProfileFromServer)
		}).catch(errorHandler);

	} else {
		firebase.database().ref('users/' + userId).set(data).then(successHandler).then(updateProfileFromServer).catch(errorHandler);
	}

})

$('#form-messenger').submit(function(e) {
	e.preventDefault();

	var data ={
		message: $('#messenger-message').val(),
		name: profile.username,
	};

	if(profile.photoURL)
		data.photoURL = profile.photoURL;

	messengerDBRef.push(data).catch(errorHandler);
	$('#messenger-message').val('');
})

$(function() {
	$('#message-success, #message-error').hide();

	var $navs = $('nav li');

	var tabs = $navs.toArray().map(function(element) {
		return element.getAttribute('data-target');
	});

	$navs.click(function(e) {
		var tab = this.getAttribute('data-target');
		setTab(tab);
	})
})